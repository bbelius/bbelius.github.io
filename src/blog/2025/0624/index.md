---
tpl: blog
title: AI-Augmented Development
author: Benjamin Belikov
date: 2025-06-24
description: Experience regarding AI augumented development of this blog.
tags: ["blog", "ai", "agent"]
type: projects
---

### How to Create This Website

Curious how far AI has come, I decided to build this site by prompting an AI agent through the entire process.

I gave it structure and intent — it handled most of the implementation. Total cost? ~$15 and less than a day's work (mostly researching legal requirements).

Final touches were made by hand mostly because it was faster than writing another prompt. Some minor visual changes were also done by me to fix alignment issues or to improve the overall look.

### Features

!features Features
* vanilla | ice-cream-cone | No External Libraries
/ Simple, but Limitless
  Built using only HTML, CSS, and JavaScript without any external libraries or frameworks.

* spa | app-window | SPA Experience
/ Smooth Experience
  Single Page Application (SPA) experience with smooth transitions and no full page reloads.

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
  Native high dynamic range (HDR) support for vibrant colors and better contrast with  compatibility for non-HDR displays and browsers.
!/features

### Used Tools

!constellation HowTo
* me | ![Ben Belikov](/img/profile.jpg) | Me
% Turn Coffee into Visions, Prompts AI-Agents, [Buy me a Coffee](https://coff.ee/bbelius)
AI builds fast. I stay in control and steer the process.

* roocode | squirrel | RooCode
% Free & Open Source, AI Agent, Code Generation, [Check it out](https://roocode.com/)
VSCode AI Agent extension, capable of understanding and executing complex coding tasks. It supports multiple AI providers, including AI Gateways like OpenRouter.

* claude | brain-circuit | AI Agent | AI Agent: Claude Code
% Code Generation, Perfect RooCode Compatibility, [Check it out](https://www.anthropic.com/)
Claude is Anthropic's advanced AI assistant known for its strong code generation skills. It excels at understanding complex requirements and producing high-quality, well-structured code.

* lucide | shell | Lucide
% Free & Open Source, 1000+ Icons, SVG Format, [Check it out](https://lucide.dev/)
A beautiful, customizable icon library that provides consistent, high-quality SVG icons.

* vscode | square-code | Visual Studio Code
% Free & Open Source, Cross-platform, Extensions, [Check it out](https://code.visualstudio.com/)
Microsoft's free, open-source code editor that serves as the foundation for modern development. With its extensive extension ecosystem, VSCode provides the perfect environment for AI-assisted coding.

* githubpages | github | GitHub Pages
% Free Hosting, Custom Domains, Git Integration, [Check it out](https://pages.github.com/)
Free static site hosting directly from GitHub repositories. GitHub Pages provides seamless deployment for static websites with automatic builds from repository changes, making it perfect for showcasing projects and portfolios.
!/constellation

### How it works

<div class="workflow-steps">
<div class="workflow-step" data-step="1">
    <div class="step-number">1</div>
    <div class="step-content">
        <h4>Setup VSCode</h4>
        <p>Install VSCode and the RooCode extension. Create an OpenRouter API key (or any provider you prefer) and configure RooCode with it and the AI model(s) you want to use.</p>
    </div>
</div>
<div class="workflow-step" data-step="2">
    <div class="step-number">2</div>
    <div class="step-content">
        <h4>AI-Assisted Development</h4>
        <p>Prompt RooCode to generate code, refactor existing code, and/or implement complex features with natural language instructions.
            Choose the AI Model that best fits your needs (Google's Gemini works great for large projects).</p>
    </div>
</div>
<div class="workflow-step" data-step="3">
    <div class="step-number">3</div>
    <div class="step-content">
        <h4>Iterative Refinement</h4>
        <p>Continuously refine and improve through AI collaboration and/or manual intervention, testing different approaches and optimizing for performance and aesthetics.</p>
    </div>
</div>
<div class="workflow-step" data-step="4">
    <div class="step-number">4</div>
    <div class="step-content">
        <h4>Polish &amp; Deploy</h4>
        <p>
            Fine-tune the final product, clean up the code, and deploy the finished website.
            You want to keep the technical debt low, so monitor what the AI does and guide it.
        </p>
    </div>
</div>
</div>

### Results & Insights

<div class="insights-grid">
<div class="insight-card positive" style="opacity: 1; transform: translateX(0px); transition: opacity 0.5s, transform 0.5s;">
    <div class="insight-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gauge-icon lucide-gauge"><path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path></svg>
    </div>
    <h4>Impressive Speed</h4>
    <p>Complex features in minutes - not hours</p>
</div>
<div class="insight-card neutral" style="opacity: 1; transform: translateX(0px); transition: opacity 0.5s 0.1s, transform 0.5s 0.1s;">
    <div class="insight-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rabbit-icon lucide-rabbit"><path d="M13 16a3 3 0 0 1 2.24 5"></path><path d="M18 12h.01"></path><path d="M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3"></path><path d="M20 8.54V4a2 2 0 1 0-4 0v3"></path><path d="M7.612 12.524a3 3 0 1 0-1.6 4.3"></path></svg>
    </div>
    <h4>Fast Output</h4>
    <p>Fast, but fragile. Monitor it to avoid regressions.</p>
</div>
<div class="insight-card neutral" style="opacity: 1; transform: translateX(0px); transition: opacity 0.5s 0.2s, transform 0.5s 0.2s;">
    <div class="insight-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-spline-icon lucide-chart-spline"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M7 16c.5-2 1.5-7 4-7 2 0 2 3 4 3 2.5 0 4.5-5 5-7"></path></svg>
    </div>
    <h4>Learning Curve</h4>
    <p>Prompting is a skill. Garbage in, garbage out.</p>
</div>
<div class="insight-card negative" style="opacity: 1; transform: translateX(0px); transition: opacity 0.5s 0.3s, transform 0.5s 0.3s;">
    <div class="insight-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock-alert-icon lucide-clock-alert"><path d="M12 6v6l4 2"></path><path d="M16 21.16a10 10 0 1 1 5-13.516"></path><path d="M20 11.5v6"></path><path d="M20 21.5h.01"></path></svg>
    </div>
    <h4>Cost &amp; Time</h4>
    <p>Delegate to AI - but stay in control.</p>
</div>
</div>
