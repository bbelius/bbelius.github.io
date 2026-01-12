---
publish: true
tpl: blog
title: Building This Website
subtitle: A Custom Static Site from Scratch
author: Benjamin Belikov
date: 2025-06-24
description: A look at the custom libraries and design choices behind this website.
tags: ["blog", "web", "design"]
category: thoughts
picture: /img/blog/0624.jpg
---

### Why Build from Scratch?

Modern web frameworks are powerful, but they come with overhead — build tools, dependencies, and abstractions that can feel excessive for a personal site.

I wanted something different: a lightweight site that loads fast, looks modern, and remains easy to maintain. 

The result is a custom static site with its own template system, markdown parser, and design library.

### Features

!features Features
* vanilla | ice-cream-cone | No External Libraries
/ Simple, but Limitless
  Built using only HTML, CSS, and JavaScript without using backend code.

* design | paintbrush | Modern Design
/ Modern, Sleek, Beautiful
  Designed with a modern aesthetic, focusing on usability and visual appeal.

* responsive | layout-panel-top | Responsive Design
/ Mobile-Native
  Fully responsive design that adapts to different screen sizes and devices.

* controls | mouse-pointer-click | Unique Controls
/ Intuitive and Engaging
  Unique controls like the constellation and interactive skill descriptions. Designed to enhance user engagement and experience.

* animations | rabbit | Smooth Animations
/ Fluid
  Includes smooth animations for transitions, hover effects, and interactive elements.

* accent-color | palette | Variable Accent Color
  Accent color changes based on the time of day.

* hdr | sun | HDR Native
/ Colorful and Vibrant
  Native high dynamic range (HDR) support for vibrant colors and better contrast with compatibility for non-HDR displays and browsers.
!/features

### The Stack

!constellation Stack
* markdrown | file-text | MarkDrown
% Custom Markdown Parser, Plugin System
A custom markdown parser with a plugin architecture. Supports extended syntax for features, workflows, constellations, and more. Each plugin adds new block types without touching the core parser.

* northlight | sun-moon | NorthLight
% Design System, OKLCH Colors, Glass Morphism
The design system powering this site. Uses OKLCH color space for HDR-native colors with automatic fallbacks. Includes glass morphism effects and the Animus animation library.

* templates | layout-template | Template Engine
% File Imports, Variable Substitution, Array Expansion
A simple but flexible template system. Markdown files specify their template via YAML frontmatter. Templates can import other templates, substitute variables, and iterate over collections.

* lucide | shell | Lucide Icons
% Free & Open Source, 1000+ Icons, SVG Format, [Check it out](https://lucide.dev/)
A beautiful, customizable icon library that provides consistent, high-quality SVG icons throughout the site.

* githubpages | github | GitHub Pages
% Free Hosting, Custom Domains, Git Integration, [Check it out](https://pages.github.com/)
Free static site hosting directly from GitHub repositories with automatic deployment on every push.
!/constellation

### Design Decisions

!workflow decisions
1. OKLCH Color Space
Using OKLCH instead of RGB or HSL. Colors are perceptually uniform, making it easy to create consistent palettes. The accent color smoothly interpolates through the day using OKLCH values.

2. Glass Morphism
Subtle backdrop blur and transparency create depth without heavy shadows. Works well on both light and dark backgrounds while keeping the interface feeling light.

3. Plugin-Based Markdown
Instead of one monolithic parser, each feature (workflows, constellations, facts) is a separate plugin. Adding new block types means writing a new plugin — the core stays simple.

4. No Build Step
Files are served directly during development with on-the-fly template processing. For production, the same files work as-is on any static host.
!/workflow

### What I Learned

!facts insights
* simplicity | feather | green | Simplicity Wins
  Fewer dependencies means less maintenance burden.

* custom | wrench | green | Custom Fits Better
  Building your own tools means they do exactly what you need.

* css | palette | yellow | CSS Has Grown Up
  Modern CSS handles layouts and effects that once required JavaScript.

* tradeoffs | scale | yellow | Trade-offs Exist
  No framework means writing more boilerplate, but full control over the result.
!/facts
