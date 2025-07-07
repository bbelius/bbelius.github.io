#r "nuget: Microsoft.AspNetCore.App, 9.0.0"
#r "nuget: YamlDotNet, 13.7.1"

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.FileProviders;
using System.Text.RegularExpressions;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Channels;
using System.Text.Json;
using YamlDotNet.Serialization;

// ---- Parameter handling ----
string rootDir = Args.Count > 0 ? Path.GetFullPath(Args[0]) : Directory.GetCurrentDirectory();

if (!Directory.Exists(rootDir))
{
    Console.WriteLine($"Directory '{rootDir}' does not exist.");
    return;
}
Console.WriteLine($"Serving from: {rootDir}");

// ---- Helper functions ----
Dictionary<string, object> LoadGlobalVariables()
{
    var globalVars = new Dictionary<string, object>();
    var globalYmlPath = Path.Combine(rootDir, "src", "global.yml");
    
    if (File.Exists(globalYmlPath))
    {
        try
        {
            var yamlContent = File.ReadAllText(globalYmlPath);
            var deserializer = new DeserializerBuilder().Build();
            var yamlObject = deserializer.Deserialize<Dictionary<string, object>>(yamlContent);
            
            if (yamlObject != null && yamlObject.ContainsKey("variables"))
            {
                // Handle the nested structure: variables: - baseUrl: "value"
                var variablesSection = yamlObject["variables"];
                if (variablesSection is List<object> variablesList)
                {
                    foreach (var item in variablesList)
                    {
                        if (item is Dictionary<object, object> variableDict)
                        {
                            foreach (var kvp in variableDict)
                            {
                                globalVars[kvp.Key.ToString()] = kvp.Value;
                            }
                        }
                    }
                }
                else if (variablesSection is Dictionary<object, object> variablesDict)
                {
                    // Handle flat structure: variables: baseUrl: "value"
                    foreach (var kvp in variablesDict)
                    {
                        globalVars[kvp.Key.ToString()] = kvp.Value;
                    }
                }
            }
            
            Console.WriteLine($"Loaded {globalVars.Count} global variables from global.yml");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading global.yml: {ex.Message}");
        }
    }
    
    return globalVars;
}

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

string GenerateCanonicalUrl(string mdPath, string baseUrl, string customCanonicalUrl)
{
    if (!string.IsNullOrEmpty(customCanonicalUrl))
    {
        return customCanonicalUrl;
    }
    
    // Get relative path from root directory
    var relativePath = Path.GetRelativePath(rootDir, mdPath);
    
    // Convert to web path (forward slashes)
    var webPath = relativePath.Replace(Path.DirectorySeparatorChar, '/');
    
    // Remove .md extension and replace with .html, but handle index files specially
    var fileName = Path.GetFileNameWithoutExtension(webPath);
    var directory = Path.GetDirectoryName(webPath)?.Replace(Path.DirectorySeparatorChar, '/') ?? "";
    
    string finalPath;
    if (fileName.Equals("index", StringComparison.OrdinalIgnoreCase))
    {
        // For index files, just use the directory path
        finalPath = string.IsNullOrEmpty(directory) ? "/" : $"/{directory}/";
    }
    else
    {
        // For other files, include the filename
        finalPath = string.IsNullOrEmpty(directory) ? $"/{fileName}.html" : $"/{directory}/{fileName}.html";
    }
    
    // Combine with baseUrl if provided
    if (string.IsNullOrEmpty(baseUrl))
    {
        return finalPath;
    }
    
    return baseUrl.TrimEnd('/') + finalPath;
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
    
    // Load global variables first
    var globalVars = LoadGlobalVariables();
    
    // Parse markdown header values, with fallback to global variables
    var title = ParseHeaderValue(mdRaw, "title") ?? globalVars.GetValueOrDefault("title")?.ToString() ?? "Untitled";
    var subtitle = ParseHeaderValue(mdRaw, "subtitle") ?? globalVars.GetValueOrDefault("subtitle")?.ToString() ?? string.Empty;
    var tags = ParseHeaderValue(mdRaw, "tags") ?? globalVars.GetValueOrDefault("tags")?.ToString() ?? "";
    var date = ParseHeaderValue(mdRaw, "date") ?? globalVars.GetValueOrDefault("date")?.ToString() ?? "";
    var description = ParseHeaderValue(mdRaw, "description") ?? globalVars.GetValueOrDefault("description")?.ToString() ?? "";
    var author = ParseHeaderValue(mdRaw, "author") ?? globalVars.GetValueOrDefault("author")?.ToString() ?? "";
    
    // Handle baseUrl and canonicalUrl
    var baseUrl = ParseHeaderValue(mdRaw, "baseUrl") ?? globalVars.GetValueOrDefault("baseUrl")?.ToString() ?? "";
    var customCanonicalUrl = ParseHeaderValue(mdRaw, "canonicalUrl") ?? globalVars.GetValueOrDefault("canonicalUrl")?.ToString();
    var canonicalUrl = GenerateCanonicalUrl(mdPath, baseUrl, customCanonicalUrl);
    
    string output = tplHtml;
    
    // Process file imports first (with circular reference protection)
    output = ProcessFileImports(output, 0);
    
    // Process advanced template replacements (e.g., {{tags:%%template%%}})
    output = ProcessAdvancedReplacements(output, mdRaw);
    
    // Replace simple template variables
    output = output.Replace("{{md}}", mdRaw);
    output = output.Replace("{{title}}", title);
    output = output.Replace("{{subtitle}}", subtitle);
    output = output.Replace("{{tags}}", tags);
    output = output.Replace("{{date}}", date);
    output = output.Replace("{{description}}", description);
    output = output.Replace("{{author}}", author);
    output = output.Replace("{{baseUrl}}", baseUrl);
    output = output.Replace("{{canonicalUrl}}", canonicalUrl);
    
    // Replace any additional global variables
    foreach (var kvp in globalVars)
    {
        var placeholder = $"{{{{{kvp.Key}}}}}";
        if (output.Contains(placeholder) && !string.IsNullOrEmpty(kvp.Value?.ToString()))
        {
            output = output.Replace(placeholder, kvp.Value.ToString());
        }
    }

    context.Response.ContentType = "text/html";
    await context.Response.WriteAsync(InjectReloadOverlay(output));
}


// Process advanced template replacements like {{field:%%template%%}}
string ProcessAdvancedReplacements(string template, string markdownRaw)
{
    // Pattern to match {{field:%%template%%}}
    var pattern = @"\{\{(\w+):%%(.+?)%%\}\}";
    var regex = new Regex(pattern, RegexOptions.Singleline);
    
    return regex.Replace(template, match =>
    {
        var fieldName = match.Groups[1].Value;
        var itemTemplate = match.Groups[2].Value;
        
        var fieldValue = ParseHeaderValue(markdownRaw, fieldName);
        if (string.IsNullOrEmpty(fieldValue))
            return "";
        
        // Try to parse as JSON array
        try
        {
            var jsonArray = JsonSerializer.Deserialize<string[]>(fieldValue);
            if (jsonArray != null)
            {
                return string.Join("", jsonArray.Select(item => 
                    itemTemplate.Replace("$", item)));
            }
        }
        catch
        {
            // If not valid JSON, try to parse as comma-separated values
            var items = fieldValue.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                 .Select(x => x.Trim())
                                 .Where(x => !string.IsNullOrEmpty(x));
            
            return string.Join("", items.Select(item => 
                itemTemplate.Replace("$", item)));
        }
        
        return "";
    });
}

// Process file imports with circular reference protection
string ProcessFileImports(string template, int depth)
{
    // Prevent infinite recursion - max 10 levels of imports
    if (depth >= 10)
    {
        Console.WriteLine($"Warning: Maximum import depth (10) reached, skipping further imports");
        return template;
    }
    
    // Pattern to match {{#filename.extension}} or {{#path/filename.extension}}
    var importPattern = @"\{\{#([^}]+)\}\}";
    var regex = new Regex(importPattern);
    var matches = regex.Matches(template);
    
    if (matches.Count == 0)
    {
        return template; // No more imports to process
    }
    
    bool hasReplacements = false;
    
    foreach (Match match in matches)
    {
        var fullMatch = match.Value;
        var filePath = match.Groups[1].Value.Trim();
        
        try
        {
            // Try to resolve the file path
            string resolvedPath = ResolveFilePath(filePath);
            
            if (File.Exists(resolvedPath))
            {
                string fileContent = File.ReadAllText(resolvedPath);
                template = template.Replace(fullMatch, fileContent);
                hasReplacements = true;
                Console.WriteLine($"Imported file: {filePath} -> {resolvedPath}");
            }
            else
            {
                Console.WriteLine($"Warning: File not found for import: {filePath} (resolved to: {resolvedPath})");
                // Replace with empty string or leave a comment
                template = template.Replace(fullMatch, $"<!-- File not found: {filePath} -->");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error importing file {filePath}: {ex.Message}");
            template = template.Replace(fullMatch, $"<!-- Error importing {filePath}: {ex.Message} -->");
        }
    }
    
    // If we made replacements, check for new imports recursively
    if (hasReplacements)
    {
        return ProcessFileImports(template, depth + 1);
    }
    
    return template;
}

string ResolveFilePath(string filePath)
{
    // If it's already an absolute path, use it as-is
    if (Path.IsPathRooted(filePath))
    {
        return filePath;
    }
    
    // Try relative to current directory first
    string currentDirPath = Path.Combine(rootDir, filePath);
    if (File.Exists(currentDirPath))
    {
        return currentDirPath;
    }
    
    // Try relative to src directory
    string srcPath = Path.Combine(rootDir, "src", filePath);
    if (File.Exists(srcPath))
    {
        return srcPath;
    }
    
    // Return the original path as fallback
    return currentDirPath;
}
