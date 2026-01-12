#!/usr/bin/env dotnet-script
#r "nuget: Microsoft.AspNetCore.App, 9.0.0"
#load "site-core.csx"

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Channels;

// ---- Parameter handling ----
string rootDir = Args.Count > 0 ? Path.GetFullPath(Args[0]) : Directory.GetCurrentDirectory();
string srcDir = Directory.Exists(Path.Combine(rootDir, "src")) ? Path.Combine(rootDir, "src") : rootDir;

if (!Directory.Exists(rootDir))
{
    Console.Error.WriteLine($"Directory '{rootDir}' does not exist.");
    return;
}

// Global variable to store preprocessed files in memory
Dictionary<string, string> preprocessedFiles = new Dictionary<string, string>();

// ---- Server-specific helper functions ----
string InjectReloadOverlay(string html)
{
    const string overlayScript = @"<script>(function(){
    var overlay;
    var reconnectInterval;

    function connect() {
        var ws = new WebSocket('ws://' + location.host + '/__reload_ws');

        ws.onopen = function() {
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
        };

        ws.onmessage = function() {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }

            overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '1rem';
            overlay.style.right = '1rem';
            overlay.style.zIndex = '99999';
            overlay.style.background = 'rgba(30,30,30,0.9)';
            overlay.style.color = '#fff';
            overlay.style.fontFamily = 'sans-serif';
            overlay.style.padding = '0.5rem 1rem';
            overlay.style.borderRadius = '0.5rem';
            overlay.style.cursor = 'pointer';
            overlay.textContent = 'Site updated. Click to reload.';
            overlay.onclick = function() { location.reload(); };
            document.body.appendChild(overlay);
        };

        ws.onclose = function() {
            if (!reconnectInterval) {
                reconnectInterval = setInterval(function() {
                    connect();
                }, 1000);
            }
        };

        ws.onerror = function() {
            ws.close();
        };
    }

    connect();
})();</script>";
    if (html.Contains("</body>"))
        return html.Replace("</body>", overlayScript + "</body>");
    else
        return html + overlayScript;
}

// ---- App and reload machinery ----
var builder = WebApplication.CreateBuilder();

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Information);

var app = builder.Build();
var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Server");

// Logger wrapper for shared functions
Action<string> log = msg => logger.LogInformation("{Message}", msg);

// Now that logger is available, run preprocessing using shared function
preprocessedFiles = PreprocessTemplates(srcDir, log);

// Create cancellation token for graceful shutdown
var cts = new CancellationTokenSource();
Console.CancelKeyPress += (sender, e) => {
    logger.LogInformation("Shutting down gracefully...");
    e.Cancel = true;
    cts.Cancel();
};

app.UseWebSockets();

var reloadChannel = Channel.CreateUnbounded<bool>();

app.Map("/__reload_ws", async context =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        using var ws = await context.WebSockets.AcceptWebSocketAsync();
        var reader = reloadChannel.Reader;
        while (ws.State == WebSocketState.Open && !cts.Token.IsCancellationRequested)
        {
            try
            {
                await reader.WaitToReadAsync(cts.Token);
                while (reader.TryRead(out var _))
                {
                    if (ws.State == WebSocketState.Open && !cts.Token.IsCancellationRequested)
                    {
                        var buffer = System.Text.Encoding.UTF8.GetBytes("reload");
                        await ws.SendAsync(buffer, WebSocketMessageType.Text, true, cts.Token);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
    else
    {
        context.Response.StatusCode = 400;
    }
});

var watcher = new FileSystemWatcher(rootDir)
{
    IncludeSubdirectories = true,
    NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.FileName | NotifyFilters.DirectoryName,
    Filter = "*.*"
};
watcher.Changed += (s, e) => CheckAndBroadcast(e.FullPath);
watcher.Created += (s, e) => CheckAndBroadcast(e.FullPath);
watcher.Renamed += (s, e) => CheckAndBroadcast(e.FullPath);
watcher.Deleted += (s, e) => CheckAndBroadcast(e.FullPath);
watcher.EnableRaisingEvents = true;

void CheckAndBroadcast(string path)
{
    var ext = Path.GetExtension(path).ToLowerInvariant();
    if (ext == ".md" || ext == ".tpl.html" || ext == ".css" || ext == ".js" || ext == ".html" || ext == ".yml" || ext == ".yaml")
    {
        reloadChannel.Writer.TryWrite(true);
    }
}

app.Use(async (context, next) =>
{
    context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
    context.Response.Headers["Pragma"] = "no-cache";
    context.Response.Headers["Expires"] = "0";

    var reqPath = context.Request.Path.Value ?? "";

    // 1. Never serve .tpl.html
    if (reqPath.EndsWith(".tpl.html", StringComparison.OrdinalIgnoreCase))
    {
        context.Response.StatusCode = 404;
        await context.Response.WriteAsync("Not found");
        return;
    }

    // 2. Serve / as index.html (or index.md as HTML with template logic)
    if (string.IsNullOrEmpty(reqPath) || reqPath == "/")
    {
        var indexPath = Path.Combine(srcDir, "index.html");
        if (File.Exists(indexPath))
        {
            var html = await File.ReadAllTextAsync(indexPath);
            context.Response.ContentType = "text/html";
            await context.Response.WriteAsync(InjectReloadOverlay(html));
            return;
        }
        var indexMdPath = Path.Combine(srcDir, "index.md");
        if (File.Exists(indexMdPath))
        {
            await ServeMarkdownAsHtml(context, indexMdPath);
            return;
        }
    }

    // 3. Handle /foo or /foo/ as a directory request if /foo is a directory
    var normalizedPath = reqPath.TrimStart('/');
    if (!string.IsNullOrEmpty(normalizedPath))
    {
        var absPath = Path.Combine(srcDir, normalizedPath.Replace('/', Path.DirectorySeparatorChar));
        if (Directory.Exists(absPath))
        {
            var indexHtml = Path.Combine(absPath, "index.html");
            if (File.Exists(indexHtml))
            {
                var html = await File.ReadAllTextAsync(indexHtml);
                context.Response.ContentType = "text/html";
                await context.Response.WriteAsync(InjectReloadOverlay(html));
                return;
            }
            var indexMd = Path.Combine(absPath, "index.md");
            if (File.Exists(indexMd))
            {
                await ServeMarkdownAsHtml(context, indexMd);
                return;
            }
        }
    }

    // 4. Check for preprocessed files in memory first
    if (preprocessedFiles.ContainsKey(reqPath))
    {
        var html = preprocessedFiles[reqPath];
        context.Response.ContentType = "text/html";
        await context.Response.WriteAsync(InjectReloadOverlay(html));
        return;
    }

    // 5. Serve .html files as static, unmodified (but not .tpl.html)
    if (reqPath.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
    {
        var htmlPath = Path.Combine(srcDir, reqPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(htmlPath))
        {
            var html = await File.ReadAllTextAsync(htmlPath);
            context.Response.ContentType = "text/html";
            await context.Response.WriteAsync(InjectReloadOverlay(html));
            return;
        }
        // If .html not found, try .md as source with template
        var mdPath = Path.Combine(srcDir,
            Regex.Replace(reqPath.TrimStart('/'), @"\.html$", ".md", RegexOptions.IgnoreCase)
                .Replace('/', Path.DirectorySeparatorChar)
        );
        if (File.Exists(mdPath))
        {
            await ServeMarkdownAsHtml(context, mdPath);
            return;
        }
    }

    await next();
});

// Handle 404 errors with preprocessed 404.html
app.Use(async (context, next) =>
{
    await next();

    if (context.Response.StatusCode == 404 && !context.Response.HasStarted)
    {
        if (preprocessedFiles.ContainsKey("/404.html"))
        {
            context.Response.StatusCode = 404;
            context.Response.ContentType = "text/html";
            await context.Response.WriteAsync(InjectReloadOverlay(preprocessedFiles["/404.html"]));
        }
    }
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(srcDir)
});

// Register cleanup handler
cts.Token.Register(() =>
{
    watcher.EnableRaisingEvents = false;
    watcher.Dispose();
    reloadChannel.Writer.TryComplete();
});

// Get the application lifetime
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();

// Register the cancellation token to stop the application
cts.Token.Register(() => lifetime.StopApplication());

// Run the app with the specified URL
await app.RunAsync("http://localhost:5000");

// Clean exit after graceful shutdown
logger.LogInformation("Server stopped.");
Environment.Exit(0);

// ---- Markdown-to-template helper using shared functions ----
async Task ServeMarkdownAsHtml(HttpContext context, string mdPath)
{
    var mdRaw = await File.ReadAllTextAsync(mdPath);

    // Check if file should be published
    var publishValue = ParseHeaderValue(mdRaw, "publish");
    if (!string.IsNullOrEmpty(publishValue) &&
        (publishValue.ToLower() == "false" || publishValue == "0"))
    {
        logger.LogDebug("Blocking access to unpublished markdown file: {Path}", mdPath);
        context.Response.StatusCode = 404;
        await context.Response.WriteAsync("Page not found");
        return;
    }

    // Use shared ProcessMarkdownFile function
    var globalVars = LoadGlobalVariables(srcDir, log);
    var output = ProcessMarkdownFile(mdPath, srcDir, globalVars, log);

    if (output == null)
    {
        context.Response.StatusCode = 500;
        await context.Response.WriteAsync("Error processing markdown file.");
        return;
    }

    context.Response.ContentType = "text/html";
    await context.Response.WriteAsync(InjectReloadOverlay(output));
}
