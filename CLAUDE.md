# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Server

This is a static blog/portfolio site with a custom C# ASP.NET development server. Run the dev server with:

```bash
dotnet script serve.csx
# or specify a different root directory
dotnet script serve.csx /path/to/site
```

The server runs at `http://localhost:5000` with:
- Live reload via WebSocket (auto-injected into HTML)
- File watching for `.md`, `.tpl.html`, `.css`, `.js`, `.yml` changes
- In-memory template preprocessing

There is no traditional build step - files are processed on-demand during development.

## Architecture Overview

### Template System

Markdown files use YAML frontmatter to specify templates and metadata:

```yaml
---
tpl: blog              # Template name (blog.tpl.html)
publish: true          # Set to false to hide from menu and 404 requests
title: Post Title
subtitle: Subtitle
author: Benjamin Belikov
date: 2025-06-20
tags: ["tag1", "tag2"]
category: projects     # projects, tutorials, or thoughts
picture: /img/blog/0620.jpg
---
```

Templates use these placeholder patterns:
- `{{variable}}` - Simple substitution (title, date, author, etc.)
- `{{#filename.tpl.html}}` - File import (recursive, max 10 depth)
- `{{tags:%%<span>$</span>%%}}` - Array expansion (splits by comma or JSON array)
- `{{::blog ... blog::}}` - Type-based iteration (used in menu.tpl.html for blog post lists)

### Template Inheritance

```
*.md (content)
  → *.tpl.html (page template: blog, landing, imprint, empty)
      → {{#headercontent.tpl.html}} (meta tags, SEO)
      → {{#styles.tpl.html}} (CSS imports)
      → {{#scripts.tpl.html}} (JS imports)
      → {{#footer.tpl.html}}
```

### Key Directories

- `src/` - Source files
  - `*.tpl.html` - HTML templates
  - `blog/2025/MMDD/index.md` - Blog posts (year/month-day structure)
  - `css/` - Stylesheets (main.css, stl.css)
  - `js/` - JavaScript (main.js)
  - `lib/markdrown/` - Custom markdown parser with plugin system
  - `lib/northlight/` - Design system (aurora-*.css, animus.*)
- `src/global.yml` - Global variables and preprocessing config

### Custom Libraries

**MarkDrown** (`src/lib/markdrown/`): Custom markdown parser with plugin architecture
- Core: `markdrown.js`
- Plugins: `plugins/*.js` (features, workflow-steps, constellation, facts)
- Supports: YAML headers, icons (`&icon-name&`), tasks, extended blockquotes

**NorthLight** (`src/lib/northlight/`): Design system
- `aurora-colors.css` - OKLCH color palette with transparency variants
- `aurora.css` - Glass morphism effects and layouts
- `animus.js/css` - Animation library

### Color System

Uses OKLCH color space for HDR-native colors. CSS variables follow pattern:
- `--aurora-{color}` - Base color
- `--aurora-{color}-a{opacity}` - Transparency variants (a01 to a95)

Time-based primary color cycling is implemented in `main.js` (24-hour OKLCH interpolation).

## Configuration

`src/global.yml`:
- `variables` - Global template variables (baseUrl, etc.)
- `preprocess` - Files to preprocess at startup (currently only menu.tpl.html)

## Content Guidelines

Blog posts go in `src/blog/2025/MMDD/index.md` with proper frontmatter. Set `publish: false` to hide drafts.

Categories: `projects`, `tutorials`, `thoughts`
