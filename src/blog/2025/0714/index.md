---
tpl: blog
title: NorthLight Design Reference
subtitle: Developer Reference
author: Benjamin Belikov
date: 2025-07-14
description: NorthLight is a modern design system using functional glassmorphism, vibrant HDR-native colors, and subtle depth for high-performance, minimal user interfaces.
tags: ["design", "northlight", "aurora"]
category: projects
picture: /img/blog/0714.jpg
---

A modern, minimal design language focused on subtle glass morphism effects and functional transparency, inspired by glow, contrast, saturation and layered transparency of the aurora borealis.

### Core Philosophy

NorthLight emphasizes **functional transparency** over decorative effects. The design system creates depth and hierarchy through subtle layering while maintaining optimal readability and performance.

### Key Principles

1. **Functional Glass Effects**: Transparency serves hierarchy and usability first, aesthetics second
2. **Performance First**: Visual effects must not compromise user experience
3. **Content Priority**: Design enhances, never competes with content
4. **Negative Space**: Information density managed through strategic whitespace
5. **Subtle Depth**: Create visual hierarchy through layering without heavy borders
6. **Clarity through Contrast**: Use of dark backgrounds with high-contrast accent colors for clear information hierarchy.
7. **Soft Transparency**: Layered glassmorphism with subtle blur and depth to create dimension without clutter.
8. **Ambient Glow**: Colored shadows and highlights provide visual context.
9. **Depth & Shadow**: Soft shadows and layered elements create a sense of space and separation, adding hierarchy to the UI.
10. **HDR Native**: Optimized for high dynamic range displays, enhancing color vibrancy and depth perception, without breaking sRGB compatibility.

## Technical Implementation

### Color System: Aurora

Clean, modern color palette with vibrant accents against dark foundations.
Check out `aurora-colors.css` for details or as css-variables reference.

**Implementation Requirements:**
- Use OKLCH color space for HDR-native color representation
- Consistent contrast ratios across all states
- Vibrant accent colors that pop against dark backgrounds

**Color Strategy:**
- **Primary**: Vibrant, saturated colors for key interactions
- **Surface**: Dark, sophisticated backgrounds with subtle variation
- **Accent**: High-contrast elements that guide user attention
- **Text**: Crisp contrast optimized for readability

### Glass Effects: Aurora Components

Glass morphism implementation focused on functional depth rather than visual spectacle.

**Performance Considerations:**
- Limit backdrop-filter especially in areas where animations are constantly being used
- Avoid animating glass effects continuously
- Test on lower-end devices

### Animation System: Animus

Micro-interactions that enhance usability without drawing attention.

**Animation Principles:**
- **Hover effects**: Immediate feedback for interactive elements
- **State transitions**: Smooth changes between UI states
- **Loading states**: Subtle progress indicators
- **No continuous motion**: Preserve battery life and avoid distraction

## Layout System

### Spatial Hierarchy

NorthLight uses consistent spacing and depth to create clear information hierarchy.

**Z-Index Strategy:**
- TODO

**Spacing Scale:**
- TODO
```css
:root {
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  /* TODO: Complete spacing scale */
}
```

### Container Design

Elements use subtle transparency and shadow to create floating effect without heavy borders.

**Container Pattern:**
```css
.aurora-container {
  /* TODO: Add final container styles */
}
```

## Component Specifications

### Interactive Elements

**Buttons:**
- Subtle glass background with aurora accent
- Hover state with gentle glow effect
- No aggressive shadows or borders
- Consistent padding and typography

**Cards:**
- Minimal borders, rely on shadow for definition
- Background adapts to aurora color palette
- Hover effects for interactive cards
- Clear content hierarchy

### Typography

**Hierarchy:**
```css
/* TODO: Add final typography scale */
```

**Color Strategy:**
- High contrast text for optimal readability
- Links use aurora accent colors
- Code blocks maintain clarity against glass backgrounds

## Design Token Reference

### Colors
```css
:root {
  /* TODO: Complete color token definitions */
}
```

### Shadows
```css
:root {
  /* TODO: Shadow system definitions */
}
```

### Border Radius
```css
:root {
  /* TODO: Border radius scale */
  --aurora-radius-sm: /* small elements */;
  --aurora-radius-md: /* standard radius */;
  --aurora-radius-lg: /* large containers */;
  --aurora-radius-full: /* circular elements */;
}
```

### Glass Effects
```css
:root {
  /* TODO: Glass effect definitions */
}
```

## Implementation Guidelines

### Getting Started

1. **Set up OKLCH color system** with vibrant accent palette
2. **Implement base glass effects** with performance monitoring
3. **Create component library** following aurora patterns
4. **Test across devices** for performance and accessibility
5. **Fine-tune visual hierarchy** through shadow and transparency

### Performance Checklist

- [ ] Animation frame rates maintain 60fps
- [ ] Glass effects don't cause performance degradation
- [ ] Effects tested on low-end devices

### Accessibility Considerations

- [ ] Sufficient contrast maintained across all color states
- [ ] Reduced motion preferences respected
- [ ] Glass effects don't interfere with screen readers
- [ ] Focus indicators visible against aurora backgrounds
- [ ] Color is not the only means of conveying information

## Design Guidelines

### When to Use Glass Effects

**Appropriate Uses:**
- Navigation elements that need to float above content
- Modal dialogs and overlays
- Interactive cards with hierarchical importance
- Subtle background elements that provide context

**Avoid Glass Effects For:**
- Primary content areas
- Text-heavy sections
- Performance-critical components
- Elements requiring maximum accessibility

### Color Application

**Primary Colors:**
- Use for key actions and navigation
- Maintain consistent saturation levels
- Ensure sufficient contrast against glass backgrounds

**Accent Colors:**
- Reserve for interactive states and highlights
- Use sparingly to maintain impact
- Test visibility across all glass effect intensities

## Future Enhancements

### Potential Additions
- Enhanced glass effects for high-end devices
- Advanced animation patterns for premium experiences
- Expanded color palette variations
- Performance optimizations for complex hierarchies

### Research Areas
- Performance optimization for complex glass hierarchies
- Accessibility improvements for transparency-heavy interfaces
- Cross-platform consistency for aurora effects
- Advanced layering techniques for depth perception

---

*NorthLight Design System - Functional transparency for modern interfaces.*
