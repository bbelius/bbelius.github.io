# aurob Design Language

**aurob** is a modern design system inspired by the glow, contrast, saturation and layered transparency of the aurora borealis.
It combines developer-centric minimalism with high-contrast gradients, soft glass effects, and bold typographic hierarchy.

## Core Principles

- **Clarity through Contrast**: Use of dark backgrounds with high-contrast accent colors for clear information hierarchy.
- **Soft Transparency**: Layered glassmorphism with subtle blur and depth to create dimension without clutter.
- **Ambient Glow**: Colored shadows and highlights provide visual context.
- **Depth & Shadow**: Soft shadows and layered elements create a sense of space and separation, adding hierarchy to the UI.
- **HDR Native**: Optimized for high dynamic range displays, enhancing color vibrancy and depth perception, without breaking sRGB compatibility.

## UI Elements

### Colors

All colors must use the `oklch` color space for better perceptual uniformity across devices, especially in HDR contexts.

| Element          |  Notes |
|------------------|--------|
| Background       | Very dark, subtle gradient |
| Primary Accent   | Warm, punchy red/orange for highlights |
| Secondary Accent | Used for badges and tags |
| Text             | Legible against dark backgrounds |
| Glow             | Used sparingly for buttons and active elements |

### Typography
Modern, but easy to read.

## Components

### Panels
- **Card-based layout**
- Rounded corners
- Shadow and blur layers to separate stacked content

### Sidebar / Drawers
- Dark semi-transparent background with blur
- Slide-in behavior with visual continuity from main UI

## Motion & Interaction

- **Soft Transitions**: Fade/slide animations with 75-100ms
- **Hover Glow**: Subtle blur/glow expansion
- **Modal/Drawer**: Slide + backdrop blur
