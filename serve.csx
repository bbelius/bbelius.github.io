#r "nuget: Microsoft.AspNetCore.App, 9.0.0"
#r "nuget: YamlDotNet, 13.7.1"

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
using System.Text.Json;
using System.Text;
using System.Linq;
using YamlDotNet.Serialization;

// ---- Parameter handling ----
string rootDir = Args.Count > 0 ? Path.GetFullPath(Args[0]) : Directory.GetCurrentDirectory();

if (!Directory.Exists(rootDir))
{
    // Can't use logger yet, so use Console for this critical error
    Console.Error.WriteLine($"Directory '{rootDir}' does not exist.");
    return;
}

// Global variable to store preprocessed files in memory
Dictionary<string, string> preprocessedFiles = new Dictionary<string, string>();

// Note: PreprocessFiles needs to be called after logger is available
// Will be called after app is built

// ---- Helper functions ----
Dictionary<string, object> LoadGlobalVariables(ILogger logger)
{
    var globalVars = new Dictionary<string, object>();
    
    // Check if we're in src directory or need to look for src subdirectory
    var globalYmlPath = Path.Combine(rootDir, "global.yml");
    if (!File.Exists(globalYmlPath))
    {
        globalYmlPath = Path.Combine(rootDir, "src", "global.yml");
    }
    
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
            
            logger.LogInformation("Loaded {Count} global variables from global.yml", globalVars.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error loading global.yml");
        }
    }
    
    return globalVars;
}

List<string> LoadPreprocessFiles(ILogger logger)
{
    var preprocessFiles = new List<string>();
    
    // Check if we're in src directory or need to look for src subdirectory
    var globalYmlPath = Path.Combine(rootDir, "global.yml");
    if (!File.Exists(globalYmlPath))
    {
        globalYmlPath = Path.Combine(rootDir, "src", "global.yml");
    }
    
    if (File.Exists(globalYmlPath))
    {
        try
        {
            var yamlContent = File.ReadAllText(globalYmlPath);
            var deserializer = new DeserializerBuilder().Build();
            var yamlObject = deserializer.Deserialize<Dictionary<string, object>>(yamlContent);
            
            if (yamlObject != null && yamlObject.ContainsKey("preprocess"))
            {
                var preprocessSection = yamlObject["preprocess"];
                if (preprocessSection is List<object> preprocessList)
                {
                    foreach (var item in preprocessList)
                    {
                        if (item is string filePath)
                        {
                            preprocessFiles.Add(filePath);
                        }
                    }
                }
            }
            
            logger.LogInformation("Loaded {Count} files for preprocessing", preprocessFiles.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error loading preprocess files from global.yml");
        }
    }
    
    return preprocessFiles;
}

class MarkdownMetadata
{
    public string FilePath { get; set; } = "";
    public string Title { get; set; } = "";
    public string Subtitle { get; set; } = "";
    public string Author { get; set; } = "";
    public string Date { get; set; } = "";
    public string Description { get; set; } = "";
    public string Tags { get; set; } = "";
    public string Type { get; set; } = "";
    public string Slug { get; set; } = "";
    public string Category { get; set; } = "";
}

Dictionary<string, List<MarkdownMetadata>> ScanMarkdownFiles(ILogger logger)
{
    var filesByTpl = new Dictionary<string, List<MarkdownMetadata>>();
    
    // Determine the correct source directory
    var srcDir = rootDir;
    if (Directory.Exists(Path.Combine(rootDir, "src")))
    {
        srcDir = Path.Combine(rootDir, "src");
    }
    
    if (!Directory.Exists(srcDir))
    {
        logger.LogWarning("Source directory not found, skipping markdown scan");
        return filesByTpl;
    }
    
    var mdFiles = Directory.GetFiles(srcDir, "*.md", SearchOption.AllDirectories);
    
    foreach (var mdFile in mdFiles)
    {
        try
        {
            var content = File.ReadAllText(mdFile);
            var tpl = ParseHeaderValue(content, "tpl");
            
            // ONLY process files that use the "blog" template
            if (tpl != "blog")
            {
                logger.LogDebug("Skipping {FileName} (tpl: '{Tpl}', not 'blog')", Path.GetFileName(mdFile), tpl);
                continue;
            }
            
            var metadata = new MarkdownMetadata
            {
                FilePath = mdFile,
                Title = ParseHeaderValue(content, "title") ?? "",
                Subtitle = ParseHeaderValue(content, "subtitle") ?? "",
                Author = ParseHeaderValue(content, "author") ?? "",
                Date = ParseHeaderValue(content, "date") ?? "",
                Description = ParseHeaderValue(content, "description") ?? "",
                Tags = ParseHeaderValue(content, "tags") ?? "",
                Type = ParseHeaderValue(content, "type") ?? "",
                Category = ParseHeaderValue(content, "category") ?? ""
            };
            
            // Generate slug from file path
            var relativePath = Path.GetRelativePath(srcDir, mdFile);
            var slug = relativePath.Replace('\\', '/').Replace(".md", "");
            if (slug.EndsWith("/index"))
            {
                slug = slug.Substring(0, slug.Length - 6); // Remove "/index"
            }
            metadata.Slug = slug;
            
            // Add to "blog" type for menu processing
            if (!filesByTpl.ContainsKey("blog"))
            {
                filesByTpl["blog"] = new List<MarkdownMetadata>();
            }
            filesByTpl["blog"].Add(metadata);
            
            logger.LogInformation("Added {FileName} to 'blog' menu (category: '{Category}', slug: {Slug})", Path.GetFileName(mdFile), metadata.Category, metadata.Slug);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing {File}", mdFile);
        }
    }
    
    logger.LogInformation("Scanned {FileCount} markdown files, found {TypeCount} template types", mdFiles.Length, filesByTpl.Count);
    foreach(var kvp in filesByTpl)
    {
        logger.LogInformation("Type '{Type}': {FileCount} files", kvp.Key, kvp.Value.Count);
    }
    
    return filesByTpl;
}

string ProcessTypeReplacements(string template, Dictionary<string, List<MarkdownMetadata>> filesByType, ILogger logger)
{
    logger.LogDebug("Processing template replacements. Template length: {Length}", template.Length);
    logger.LogDebug("Available types: {Types}", string.Join(", ", filesByType.Keys));
    
    // Pattern to match {{::TYPE ... TYPE::}}
    var pattern = @"\{\{::(\w+)(.*?)\1::\}\}";
    var regex = new Regex(pattern, RegexOptions.Singleline | RegexOptions.IgnoreCase);
    
    var matches = regex.Matches(template);
    logger.LogDebug("Found {Count} template replacement patterns", matches.Count);
    
    return regex.Replace(template, match =>
    {
        var typeName = match.Groups[1].Value;
        var innerTemplate = match.Groups[2].Value;
        
        logger.LogDebug("Processing type: '{Type}', inner template length: {Length}", typeName, innerTemplate.Length);
        
        // FIX: If template asks for "blog", collect ALL files regardless of their type
        List<MarkdownMetadata> files = new List<MarkdownMetadata>();
        
        if (typeName.ToLower() == "blog")
        {
            // Collect ALL markdown files regardless of type
            foreach (var typeGroup in filesByType.Values)
            {
                files.AddRange(typeGroup);
            }
            logger.LogDebug("Blog template: using all {Count} files", files.Count);
        }
        else if (filesByType.ContainsKey(typeName))
        {
            files = filesByType[typeName];
            logger.LogDebug("Found {Count} files for type '{Type}'", files.Count, typeName);
        }
        else
        {
            logger.LogWarning("No files found for type: {Type}", typeName);
            return "";
        }
        
        var result = new StringBuilder();
        
        // Sort files by date (newest first) before processing
        var sortedFiles = files.OrderByDescending(f => 
        {
            // Try to parse the date string to ensure proper date sorting
            if (DateTime.TryParse(f.Date, out DateTime parsedDate))
            {
                return parsedDate;
            }
            // If date parsing fails, use a default old date
            return DateTime.MinValue;
        }).ToList();
        
        logger.LogDebug("Sorted {Count} files by date (newest first)", sortedFiles.Count);
        
        foreach (var file in sortedFiles)
        {
            logger.LogDebug("Processing file: {Title} (date: {Date}, slug: {Slug})", file.Title, file.Date, file.Slug);
            
            var processedTemplate = innerTemplate
                .Replace("{{title}}", file.Title)
                .Replace("{{subtitle}}", file.Subtitle)
                .Replace("{{author}}", file.Author)
                .Replace("{{date}}", file.Date)
                .Replace("{{description}}", file.Description)
                .Replace("{{tags}}", file.Tags)
                .Replace("{{type}}", file.Type)
                .Replace("{{slug}}", file.Slug)
                .Replace("{{category}}", file.Category);
            
            result.Append(processedTemplate);
        }
        
        logger.LogDebug("Generated result length: {Length}", result.Length);
        return result.ToString();
    });
}

void PreprocessFiles(ILogger logger)
{
    var preprocessFiles = LoadPreprocessFiles(logger);
    var filesByTpl = ScanMarkdownFiles(logger);
    
    foreach (var preprocessFile in preprocessFiles)
    {
        try
        {
            // Check if we're in src directory or need to look for src subdirectory
            var templatePath = Path.Combine(rootDir, preprocessFile);
            if (!File.Exists(templatePath))
            {
                templatePath = Path.Combine(rootDir, "src", preprocessFile);
            }
            
            if (!File.Exists(templatePath))
            {
                logger.LogWarning("Template file not found: {Path}", templatePath);
                continue;
            }
            
            var template = File.ReadAllText(templatePath);
            var processed = ProcessTypeReplacements(template, filesByTpl, logger);
            
            // Generate output file path (remove .tpl from filename)
            var outputFileName = preprocessFile.Replace(".tpl.html", ".html");
            var virtualPath = "/" + outputFileName;
            
            // Store in memory instead of writing to disk
            preprocessedFiles[virtualPath] = processed;
            logger.LogInformation("Preprocessed {Source} -> {Target} (stored in memory)", preprocessFile, outputFileName);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error preprocessing {File}", preprocessFile);
        }
    }
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
    var overlay;
    var reconnectInterval;
    
    function connect() {
        var ws = new WebSocket('ws://' + location.host + '/__reload_ws');
        
        ws.onopen = function() {
            // Clear any reconnect interval when connected
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
        };
        
        ws.onmessage = function() {
            // Remove any existing overlay
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
            // Reconnect after 1 second if connection is lost
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

// Now that logger is available, run preprocessing
PreprocessFiles(logger);

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
    var globalVars = LoadGlobalVariables(logger);
    
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
    output = ProcessFileImports(output, 0, logger);
    
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
        
        // Try to parse as JSON array, otherwise treat as comma-separated
        try
        {
            if (fieldValue.Trim().StartsWith("["))
            {
                var jsonArray = JsonSerializer.Deserialize<string[]>(fieldValue);
                if (jsonArray != null)
                {
                    return string.Join("", jsonArray.Select(item =>
                        itemTemplate.Replace("$", item)));
                }
            }
        }
        catch (JsonException) { /* Fall through to comma-separated parsing */ }

        // Fallback to comma-separated values
        var items = fieldValue.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                .Select(x => x.Trim())
                                .Where(x => !string.IsNullOrEmpty(x));
        
        return string.Join("", items.Select(item =>
            itemTemplate.Replace("$", item)));
        
        return "";
    });
}

// Process file imports with circular reference protection
string ProcessFileImports(string template, int depth, ILogger logger)
{
    // Prevent infinite recursion - max 10 levels of imports
    if (depth >= 10)
    {
        logger.LogWarning("Maximum import depth (10) reached, skipping further imports");
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
                logger.LogDebug("Imported file: {Source} -> {Resolved}", filePath, resolvedPath);
            }
            else
            {
                logger.LogWarning("File not found for import: {File} (resolved to: {Resolved})", filePath, resolvedPath);
                // Replace with empty string or leave a comment
                template = template.Replace(fullMatch, $"<!-- File not found: {filePath} -->");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error importing file {File}", filePath);
            template = template.Replace(fullMatch, $"<!-- Error importing {filePath}: {ex.Message} -->");
        }
    }
    
    // If we made replacements, check for new imports recursively
    if (hasReplacements)
    {
        return ProcessFileImports(template, depth + 1, logger);
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
