// site-core.csx - Shared transformation functions for serve.csx and build.csx
#r "nuget: YamlDotNet, 13.7.1"

using System.Text.RegularExpressions;
using System.Text.Json;
using System.Text;
using System.Linq;
using YamlDotNet.Serialization;

// ---- Helper Classes ----
public class MarkdownMetadata
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
    public string Picture { get; set; } = "";
}

// ---- Core Transformation Functions ----

public static string ParseHeaderValue(string text, string key)
{
    var match = Regex.Match(text, @"^---\s*([\s\S]*?)---", RegexOptions.Multiline);
    if (!match.Success) return null;
    var header = match.Groups[1].Value;
    var keyMatch = Regex.Match(header, @"^" + Regex.Escape(key) + @":\s*(.+)$", RegexOptions.Multiline);
    if (!keyMatch.Success) return null;
    return keyMatch.Groups[1].Value.Trim();
}

public static string RemoveHeader(string text)
{
    var match = Regex.Match(text, @"^---\s*([\s\S]*?)---\s*", RegexOptions.Multiline);
    if (!match.Success) return text;
    return text.Substring(match.Length);
}

public static Dictionary<string, object> LoadGlobalVariables(string srcDir, Action<string> log = null)
{
    var globalVars = new Dictionary<string, object>();
    var globalYmlPath = Path.Combine(srcDir, "global.yml");

    if (File.Exists(globalYmlPath))
    {
        try
        {
            var yamlContent = File.ReadAllText(globalYmlPath);
            var deserializer = new DeserializerBuilder().Build();
            var yamlObject = deserializer.Deserialize<Dictionary<string, object>>(yamlContent);

            if (yamlObject != null && yamlObject.ContainsKey("variables"))
            {
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
                    foreach (var kvp in variablesDict)
                    {
                        globalVars[kvp.Key.ToString()] = kvp.Value;
                    }
                }
            }

            log?.Invoke($"Loaded {globalVars.Count} global variables from global.yml");
        }
        catch (Exception ex)
        {
            log?.Invoke($"Error loading global.yml: {ex.Message}");
        }
    }

    return globalVars;
}

public static List<string> LoadPreprocessFiles(string srcDir, Action<string> log = null)
{
    var preprocessFiles = new List<string>();
    var globalYmlPath = Path.Combine(srcDir, "global.yml");

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

            log?.Invoke($"Loaded {preprocessFiles.Count} files for preprocessing");
        }
        catch (Exception ex)
        {
            log?.Invoke($"Error loading preprocess files: {ex.Message}");
        }
    }

    return preprocessFiles;
}

public static Dictionary<string, List<MarkdownMetadata>> ScanMarkdownFiles(string srcDir, Action<string> log = null)
{
    var filesByTpl = new Dictionary<string, List<MarkdownMetadata>>();

    if (!Directory.Exists(srcDir))
    {
        log?.Invoke("Source directory not found, skipping markdown scan");
        return filesByTpl;
    }

    var mdFiles = Directory.GetFiles(srcDir, "*.md", SearchOption.AllDirectories);

    foreach (var mdFile in mdFiles)
    {
        try
        {
            var content = File.ReadAllText(mdFile);

            // Check if file should be published
            var publishValue = ParseHeaderValue(content, "publish");
            if (!string.IsNullOrEmpty(publishValue) &&
                (publishValue.ToLower() == "false" || publishValue == "0"))
            {
                log?.Invoke($"Skipping unpublished: {Path.GetFileName(mdFile)}");
                continue;
            }

            var tpl = ParseHeaderValue(content, "tpl");

            // Only process files that use the "blog" template for menu
            if (tpl != "blog")
            {
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
                Category = ParseHeaderValue(content, "category") ?? "",
                Picture = ParseHeaderValue(content, "picture") ?? ""
            };

            // Generate slug from file path
            var relativePath = Path.GetRelativePath(srcDir, mdFile);
            var slug = relativePath.Replace('\\', '/').Replace(".md", "");
            if (slug.EndsWith("/index"))
            {
                slug = slug.Substring(0, slug.Length - 6);
            }
            metadata.Slug = slug;

            if (!filesByTpl.ContainsKey("blog"))
            {
                filesByTpl["blog"] = new List<MarkdownMetadata>();
            }
            filesByTpl["blog"].Add(metadata);

            log?.Invoke($"Added {Path.GetFileName(mdFile)} to blog menu (category: {metadata.Category})");
        }
        catch (Exception ex)
        {
            log?.Invoke($"Error processing {mdFile}: {ex.Message}");
        }
    }

    return filesByTpl;
}

public static string ProcessTypeReplacements(string template, Dictionary<string, List<MarkdownMetadata>> filesByType, Action<string> log = null)
{
    var pattern = @"\{\{::(\w+)(.*?)\1::\}\}";
    var regex = new Regex(pattern, RegexOptions.Singleline | RegexOptions.IgnoreCase);

    return regex.Replace(template, match =>
    {
        var typeName = match.Groups[1].Value;
        var innerTemplate = match.Groups[2].Value;

        List<MarkdownMetadata> files = new List<MarkdownMetadata>();

        if (typeName.ToLower() == "blog")
        {
            foreach (var typeGroup in filesByType.Values)
            {
                files.AddRange(typeGroup);
            }
            log?.Invoke($"Blog template: using all {files.Count} files");
        }
        else if (filesByType.ContainsKey(typeName))
        {
            files = filesByType[typeName];
            log?.Invoke($"Found {files.Count} files for type '{typeName}'");
        }
        else
        {
            log?.Invoke($"Warning: No files found for type: {typeName}");
            return "";
        }

        var result = new StringBuilder();

        // Sort files by date (newest first)
        var sortedFiles = files.OrderByDescending(f =>
        {
            if (DateTime.TryParse(f.Date, out DateTime parsedDate))
            {
                return parsedDate;
            }
            return DateTime.MinValue;
        }).ToList();

        foreach (var file in sortedFiles)
        {
            var processedTemplate = innerTemplate
                .Replace("{{title}}", file.Title)
                .Replace("{{subtitle}}", file.Subtitle)
                .Replace("{{author}}", file.Author)
                .Replace("{{date}}", file.Date)
                .Replace("{{description}}", file.Description)
                .Replace("{{tags}}", file.Tags)
                .Replace("{{type}}", file.Type)
                .Replace("{{slug}}", file.Slug)
                .Replace("{{category}}", file.Category)
                .Replace("{{picture}}", file.Picture);

            result.Append(processedTemplate);
        }

        return result.ToString();
    });
}

public static string ProcessFileImports(string template, string srcDir, int depth = 0, Action<string> log = null)
{
    if (depth >= 10)
    {
        log?.Invoke("Warning: Maximum import depth (10) reached");
        return template;
    }

    var importPattern = @"\{\{#([^}]+)\}\}";
    var regex = new Regex(importPattern);
    var matches = regex.Matches(template);

    if (matches.Count == 0)
    {
        return template;
    }

    bool hasReplacements = false;

    foreach (Match match in matches)
    {
        var fullMatch = match.Value;
        var filePath = match.Groups[1].Value.Trim();

        try
        {
            var resolvedPath = ResolveFilePath(filePath, srcDir);

            if (File.Exists(resolvedPath))
            {
                string fileContent = File.ReadAllText(resolvedPath);
                template = template.Replace(fullMatch, fileContent);
                hasReplacements = true;
                log?.Invoke($"Imported file: {filePath}");
            }
            else
            {
                log?.Invoke($"Warning: File not found for import: {filePath}");
                template = template.Replace(fullMatch, $"<!-- File not found: {filePath} -->");
            }
        }
        catch (Exception ex)
        {
            log?.Invoke($"Error importing {filePath}: {ex.Message}");
            template = template.Replace(fullMatch, $"<!-- Error importing {filePath}: {ex.Message} -->");
        }
    }

    if (hasReplacements)
    {
        return ProcessFileImports(template, srcDir, depth + 1, log);
    }

    return template;
}

public static string ResolveFilePath(string filePath, string srcDir)
{
    // If it's already an absolute path, use it as-is
    if (Path.IsPathRooted(filePath))
    {
        return filePath;
    }

    // Try relative to src directory
    string srcPath = Path.Combine(srcDir, filePath);
    if (File.Exists(srcPath))
    {
        return srcPath;
    }

    return srcPath;
}

public static string ProcessAdvancedReplacements(string template, string markdownRaw)
{
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
    });
}

public static string GenerateCanonicalUrl(string mdPath, string srcDir, string baseUrl, string customCanonicalUrl)
{
    if (!string.IsNullOrEmpty(customCanonicalUrl))
    {
        return customCanonicalUrl;
    }

    var relativePath = Path.GetRelativePath(srcDir, mdPath);
    var webPath = relativePath.Replace(Path.DirectorySeparatorChar, '/');

    var fileName = Path.GetFileNameWithoutExtension(webPath);
    var directory = Path.GetDirectoryName(webPath)?.Replace(Path.DirectorySeparatorChar, '/') ?? "";

    string finalPath;
    if (fileName.Equals("index", StringComparison.OrdinalIgnoreCase))
    {
        finalPath = string.IsNullOrEmpty(directory) ? "/" : $"/{directory}/";
    }
    else
    {
        finalPath = string.IsNullOrEmpty(directory) ? $"/{fileName}.html" : $"/{directory}/{fileName}.html";
    }

    if (string.IsNullOrEmpty(baseUrl))
    {
        return finalPath;
    }

    return baseUrl.TrimEnd('/') + finalPath;
}

public static string ProcessMarkdownFile(string mdPath, string srcDir, Dictionary<string, object> globalVars, Action<string> log = null)
{
    var mdRaw = File.ReadAllText(mdPath);

    // Check if file should be published
    var publishValue = ParseHeaderValue(mdRaw, "publish");
    if (!string.IsNullOrEmpty(publishValue) &&
        (publishValue.ToLower() == "false" || publishValue == "0"))
    {
        log?.Invoke($"Skipping unpublished: {mdPath}");
        return null;
    }

    var tplName = ParseHeaderValue(mdRaw, "tpl");
    if (tplName == null)
    {
        log?.Invoke($"Missing 'tpl' header in {mdPath}");
        return null;
    }

    var tplPath = Path.Combine(srcDir, $"{tplName}.tpl.html");
    if (!File.Exists(tplPath))
    {
        log?.Invoke($"Template not found: {tplPath}");
        return null;
    }

    var output = File.ReadAllText(tplPath);

    // Process file imports first
    output = ProcessFileImports(output, srcDir, 0, log);

    // Process advanced template replacements
    output = ProcessAdvancedReplacements(output, mdRaw);

    // Parse markdown header values with fallback to global variables
    var title = ParseHeaderValue(mdRaw, "title") ?? globalVars.GetValueOrDefault("title")?.ToString() ?? "Untitled";
    var subtitle = ParseHeaderValue(mdRaw, "subtitle") ?? globalVars.GetValueOrDefault("subtitle")?.ToString() ?? "";
    var tags = ParseHeaderValue(mdRaw, "tags") ?? globalVars.GetValueOrDefault("tags")?.ToString() ?? "";
    var date = ParseHeaderValue(mdRaw, "date") ?? globalVars.GetValueOrDefault("date")?.ToString() ?? "";
    var description = ParseHeaderValue(mdRaw, "description") ?? globalVars.GetValueOrDefault("description")?.ToString() ?? "";
    var author = ParseHeaderValue(mdRaw, "author") ?? globalVars.GetValueOrDefault("author")?.ToString() ?? "";

    var baseUrl = ParseHeaderValue(mdRaw, "baseUrl") ?? globalVars.GetValueOrDefault("baseUrl")?.ToString() ?? "";
    var customCanonicalUrl = ParseHeaderValue(mdRaw, "canonicalUrl") ?? globalVars.GetValueOrDefault("canonicalUrl")?.ToString();
    var canonicalUrl = GenerateCanonicalUrl(mdPath, srcDir, baseUrl, customCanonicalUrl);

    // Escape HTML for source display
    var escapedMd = System.Net.WebUtility.HtmlEncode(mdRaw);

    output = output.Replace("{{md}}", escapedMd);
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

    return output;
}

public static Dictionary<string, string> PreprocessTemplates(string srcDir, Action<string> log = null)
{
    var preprocessedFiles = new Dictionary<string, string>();
    var preprocessFilesList = LoadPreprocessFiles(srcDir, log);
    var filesByTpl = ScanMarkdownFiles(srcDir, log);

    foreach (var preprocessFile in preprocessFilesList)
    {
        try
        {
            var templatePath = Path.Combine(srcDir, preprocessFile);

            if (!File.Exists(templatePath))
            {
                log?.Invoke($"Warning: Template file not found: {templatePath}");
                continue;
            }

            var template = File.ReadAllText(templatePath);
            var processed = ProcessTypeReplacements(template, filesByTpl, log);

            var outputFileName = preprocessFile.Replace(".tpl.html", ".html");
            var virtualPath = "/" + outputFileName;

            preprocessedFiles[virtualPath] = processed;
            log?.Invoke($"Preprocessed {preprocessFile} -> {outputFileName}");
        }
        catch (Exception ex)
        {
            log?.Invoke($"Error preprocessing {preprocessFile}: {ex.Message}");
        }
    }

    return preprocessedFiles;
}
