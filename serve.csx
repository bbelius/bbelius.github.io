#r "nuget: Microsoft.AspNetCore.App, 9.0.0"

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.FileProviders;
using System.Text.RegularExpressions;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Channels;

// ---- Parameter handling ----
string rootDir = Args.Count > 0 ? Path.GetFullPath(Args[0]) : Directory.GetCurrentDirectory();

if (!Directory.Exists(rootDir))
{
    Console.WriteLine($"Directory '{rootDir}' does not exist.");
    return;
}
Console.WriteLine($"Serving from: {rootDir}");

// ---- Helper functions ----
string ParseHeaderValue(string text, string key)
{
    var match = Regex.Match(text, @"^---\s*([\s\S]*?)---", RegexOptions.Multiline);
    if (!match.Success) return null;
    var header = match.Groups[1].Value;
    var keyMatch = Regex.Match(header, @"^" + Regex.Escape(key) + @":\s*(.+)$", RegexOptions.Multiline);
    if (!keyMatch.Success) return null;
    return keyMatch.Groups[1].Value.Trim();
}
string RemoveHeader(string text)
{
    var match = Regex.Match(text, @"^---\s*([\s\S]*?)---\s*", RegexOptions.Multiline);
    if (!match.Success) return text;
    return text.Substring(match.Length);
}
string InjectReloadOverlay(string html)
{
    const string overlayScript = @"<script>(function(){
    var ws = new WebSocket('ws://' + location.host + '/__reload_ws');
    var updated = false;
    var overlay;
    ws.onmessage = function() {
        if(updated) return;
        updated = true;
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
})();</script>";
    if (html.Contains("</body>"))
        return html.Replace("</body>", overlayScript + "</body>");
    else
        return html + overlayScript;
}

// ---- App and reload machinery ----
var builder = WebApplication.CreateBuilder();
var app = builder.Build();

app.UseWebSockets();

var reloadChannel = Channel.CreateUnbounded<bool>();

app.Map("/__reload_ws", async context =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        using var ws = await context.WebSockets.AcceptWebSocketAsync();
        var reader = reloadChannel.Reader;
        while (ws.State == WebSocketState.Open)
        {
            await reader.WaitToReadAsync();
            while (reader.TryRead(out var _))
            {
                if (ws.State == WebSocketState.Open)
                {
                    var buffer = System.Text.Encoding.UTF8.GetBytes("reload");
                    await ws.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
                }
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
    if (ext == ".md" || ext == ".tpl.html" || ext == ".css" || ext == ".js")
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
        var indexPath = Path.Combine(rootDir, "index.html");
        if (File.Exists(indexPath))
        {
            var html = await File.ReadAllTextAsync(indexPath);
            context.Response.ContentType = "text/html";
            await context.Response.WriteAsync(InjectReloadOverlay(html));
            return;
        }
        var indexMdPath = Path.Combine(rootDir, "index.md");
        if (File.Exists(indexMdPath))
        {
            await ServeMarkdownAsHtml(context, indexMdPath, rootDir);
            return;
        }
    }

    // 3. Handle /foo or /foo/ as a directory request if /foo is a directory
    var normalizedPath = reqPath.TrimStart('/');
    if (!string.IsNullOrEmpty(normalizedPath))
    {
        var absPath = Path.Combine(rootDir, normalizedPath.Replace('/', Path.DirectorySeparatorChar));
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
                await ServeMarkdownAsHtml(context, indexMd, absPath);
                return;
            }
        }
    }

    // 4. Serve .html files as static, unmodified (but not .tpl.html)
    if (reqPath.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
    {
        var htmlPath = Path.Combine(rootDir, reqPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(htmlPath))
        {
            var html = await File.ReadAllTextAsync(htmlPath);
            context.Response.ContentType = "text/html";
            await context.Response.WriteAsync(InjectReloadOverlay(html));
            return;
        }
        // If .html not found, try .md as source with template
        var mdPath = Path.Combine(rootDir,
            Regex.Replace(reqPath.TrimStart('/'), @"\.html$", ".md", RegexOptions.IgnoreCase)
                .Replace('/', Path.DirectorySeparatorChar)
        );
        if (File.Exists(mdPath))
        {
            await ServeMarkdownAsHtml(context, mdPath, Path.GetDirectoryName(mdPath));
            return;
        }
    }

    await next();
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(rootDir)
});

app.Run("http://localhost:5000");

// ---- Markdown-to-template helper ----
async Task ServeMarkdownAsHtml(HttpContext context, string mdPath, string searchRoot)
{
    var mdRaw = await File.ReadAllTextAsync(mdPath);
    var tplName = ParseHeaderValue(mdRaw, "tpl");
    if (tplName == null)
    {
        context.Response.StatusCode = 500;
        await context.Response.WriteAsync("Missing 'tpl' header in markdown file.");
        return;
    }
    var dir = searchRoot;
    string tplPath = null;
    while (!string.IsNullOrEmpty(dir) && dir.StartsWith(rootDir))
    {
        var candidate = Path.Combine(dir, tplName + ".tpl.html");
        if (File.Exists(candidate))
        {
            tplPath = candidate;
            break;
        }
        var parent = Directory.GetParent(dir);
        if (parent == null) break;
        dir = parent.FullName;
    }
    if (tplPath == null)
    {
        context.Response.StatusCode = 404;
        await context.Response.WriteAsync($"Template '{tplName}.tpl.html' not found.");
        return;
    }
    var tplHtml = await File.ReadAllTextAsync(tplPath);
    var mdContent = RemoveHeader(mdRaw);

    string output;
    if (tplHtml.Contains("<!-- MD_PLACEHOLDER -->"))
        output = tplHtml.Replace("<!-- MD_PLACEHOLDER -->", mdContent);
    else if (tplHtml.Contains("{{md}}"))
        output = tplHtml.Replace("{{md}}", mdContent);
    else
        output = tplHtml + "\n" + mdContent;

    context.Response.ContentType = "text/html";
    await context.Response.WriteAsync(InjectReloadOverlay(output));
}
