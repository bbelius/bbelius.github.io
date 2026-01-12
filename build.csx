#!/usr/bin/env dotnet-script
#load "site-core.csx"

// ---- Parameter handling ----
string srcDir = Args.Count > 0 ? Path.GetFullPath(Args[0]) : Path.Combine(Directory.GetCurrentDirectory(), "src");
string outDir = Args.Count > 1 ? Path.GetFullPath(Args[1]) : Path.Combine(Directory.GetCurrentDirectory(), "dist");

Console.WriteLine($"Building site from {srcDir} to {outDir}");

if (!Directory.Exists(srcDir))
{
    Console.Error.WriteLine($"Source directory '{srcDir}' does not exist.");
    return;
}

// Logger wrapper for shared functions
Action<string> log = msg => Console.WriteLine(msg);

// ---- Main Build Process ----
Console.WriteLine("\n=== Starting build ===\n");

// Clean output directory
if (Directory.Exists(outDir))
{
    Directory.Delete(outDir, true);
}
Directory.CreateDirectory(outDir);

// Load global variables using shared function
var globalVars = LoadGlobalVariables(srcDir, log);

// Scan markdown files and preprocess templates using shared functions
var filesByTpl = ScanMarkdownFiles(srcDir, log);
var preprocessFiles = LoadPreprocessFiles(srcDir, log);
var preprocessedContent = new Dictionary<string, string>();

foreach (var preprocessFile in preprocessFiles)
{
    var templatePath = Path.Combine(srcDir, preprocessFile);

    if (!File.Exists(templatePath))
    {
        Console.WriteLine($"Warning: Template file not found: {templatePath}");
        continue;
    }

    var template = File.ReadAllText(templatePath);
    template = ProcessTypeReplacements(template, filesByTpl, log);

    var outputFileName = preprocessFile.Replace(".tpl.html", ".html");
    preprocessedContent[outputFileName] = template;

    Console.WriteLine($"Preprocessed {preprocessFile} -> {outputFileName}");
}

// Process all files
Console.WriteLine("\nProcessing files...");

void ProcessDirectory(string dir, string relPath = "")
{
    foreach (var file in Directory.GetFiles(dir))
    {
        var fileName = Path.GetFileName(file);
        var relFilePath = string.IsNullOrEmpty(relPath) ? fileName : Path.Combine(relPath, fileName);
        var destPath = Path.Combine(outDir, relFilePath);

        // Skip template files
        if (fileName.EndsWith(".tpl.html"))
        {
            continue;
        }

        // Skip global.yml
        if (fileName == "global.yml")
        {
            continue;
        }

        // Process markdown files into HTML using shared function
        if (fileName.EndsWith(".md"))
        {
            var html = ProcessMarkdownFile(file, srcDir, globalVars, log);
            if (html != null)
            {
                var htmlPath = destPath.Replace(".md", ".html");
                Directory.CreateDirectory(Path.GetDirectoryName(htmlPath));
                File.WriteAllText(htmlPath, html);
                Console.WriteLine($"Built: {relFilePath} -> {Path.GetRelativePath(outDir, htmlPath)}");
            }
        }
        else
        {
            // Copy other files as-is
            Directory.CreateDirectory(Path.GetDirectoryName(destPath));
            File.Copy(file, destPath, true);
        }
    }

    foreach (var subDir in Directory.GetDirectories(dir))
    {
        var subDirName = Path.GetFileName(subDir);
        var newRelPath = string.IsNullOrEmpty(relPath) ? subDirName : Path.Combine(relPath, subDirName);
        ProcessDirectory(subDir, newRelPath);
    }
}

ProcessDirectory(srcDir);

// Write preprocessed files (overwrite if they exist)
Console.WriteLine("\nWriting preprocessed files...");
foreach (var kvp in preprocessedContent)
{
    var outputPath = Path.Combine(outDir, kvp.Key);
    Directory.CreateDirectory(Path.GetDirectoryName(outputPath));
    File.WriteAllText(outputPath, kvp.Value);
    Console.WriteLine($"Wrote: {kvp.Key}");
}

Console.WriteLine("\n=== Build complete ===\n");
Console.WriteLine($"Output directory: {outDir}");
