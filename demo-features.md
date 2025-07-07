---
title: Feature List Demo
author: Ben
date: 2025-06-28
---

# Feature List Demo

This demonstrates the new feature list syntax for Markdrown.

!features Core Competencies
* team-leadership | users | Team Leadership
  2023+ • Vienna Symphonic Library
  Transparency, not control - helping engineers grow, ship confidently, and own their work.

* devops-cicd | server-cog | DevOps & CI/CD
  10+ years • NP4, Vienna Symphonic Library
  Beyond writing code - I build and run the pipelines, deployments, and infrastructure that keep it alive in production.

* system-design | pencil-ruler | System Design
  2020+ • Vienna Symphonic Library
  I design scalable, maintainable systems with focus on reliability and future growth while balancing technical debt and business requirements.

* project-planning | land-plot | Project Planning
  2023+ • Vienna Symphonic Library
  I turn ideas into roadmaps - balancing risk, speed, and clarity to get from "what if" to "done".

* agile-methodologies | zap | Pragmatic Agile Methodologies
  2020+ • Vienna Symphonic Library
  I implement agile practices that actually work in real-world scenarios, focusing on value delivery over ceremony and adapting processes to team needs.

* aspnet-core | braces | ASP.NET Core
  10+ years • NP4, Vienna Symphonic Library
  I build APIs and web backends with .NET Core — modular, testable, and built for scale.

* kubernetes-docker | boxes | Kubernetes & Docker
  2024+ • Vienna Symphonic Library
  From local dev to live rollout — I containerize, orchestrate, and run apps with confidence.

* infrastructure-as-code | file-code | Infrastructure as Code
  2025+ • Vienna Symphonic Library
  Automating infrastructure provisioning and management ensuring consistent, reproducible environments.

* audio-domain | audio-lines | Domain: Audio & Virtual Instruments
  2019+ • Vienna Symphonic Library
  I have specialized expertise in audio technology, virtual instruments, and music production software, combining technical skills with deep domain knowledge.
!/features

## Another Example

!features Technical Skills
* javascript | code | JavaScript
  ES6+, Node.js, TypeScript
  Modern JavaScript development with focus on clean, maintainable code.

* react | layers | React
  Hooks, Context, Performance
  Building interactive UIs with React ecosystem and best practices.

* docker | package | Docker
  Containerization expert
  Creating efficient, secure container images for development and production.
!/features

## Syntax Explanation

The feature list syntax follows this pattern:

```markdown
!features Section Title
* feature-id | lucide-icon-name | Display Name
  Meta information line (dates, companies, etc.)
  Description content that can span multiple lines
  and include **formatting**.

* another-feature | icon-name | Another Feature
  Meta line
  Description here.
!/features
```

Key points:
- Start with `!features` followed by optional section title
- Each feature starts with `* feature-id | icon-name | Display Name`
- Next line should be meta information (timeline, company, etc.)
- Following lines are the description content
- End with `!/features`
- Icon names should be valid Lucide icons
- Feature IDs should be lowercase with hyphens