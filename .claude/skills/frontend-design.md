---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: https://github.com/anthropics/skills/blob/main/skills/frontend-design/LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

Then implement working code that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics

Raise the bar on visual quality through:

### Typography
- Use font weight, size contrast, and spacing as primary design elements
- Pair typefaces with clear hierarchy (display vs body vs mono)
- Treat text as visual texture — consider letter-spacing, line-height, text-transform
- Use variable fonts when appropriate for fluid responsiveness

### Color
- Build cohesive palettes: 1-2 primary colors + neutrals + 1 accent
- Use color purposefully: convey meaning, create hierarchy, guide attention
- Consider: gradients, transparency, color temperature, saturation contrast
- Dark themes: avoid pure black (#000); use dark neutrals with slight hue

### Layout & Space
- Use whitespace aggressively — empty space is a design element
- Create rhythm through consistent spacing scales (4px, 8px, 16px, etc.)
- Asymmetry and tension can be more interesting than perfect balance
- Consider the "fold" — what users see first sets the entire tone

### Motion & Interaction
- Micro-interactions reward user actions (hover, focus, click states)
- Transitions should feel physical: ease-in-out, spring physics
- Animate purposefully — motion should communicate, not decorate
- Prefer CSS transitions/animations; use JS only when necessary

### Details That Elevate
- Custom cursors, selection colors, scrollbar styling
- Subtle textures, noise overlays, grain effects
- Inner shadows, layered box-shadows for depth
- Border treatments: gradients, partial borders, glow effects
- Focus states that look designed, not just functional

## Code Quality

- Use semantic HTML — structure should communicate meaning
- CSS: prefer custom properties for theming; use modern layout (Grid, Flexbox)
- React: small composable components; co-locate styles with components
- Performance: lazy load images, minimize repaints, avoid layout thrash
- Accessibility: ARIA labels, keyboard navigation, sufficient color contrast

## Anti-Patterns to Avoid

- Generic card grids with identical padding/border-radius everywhere
- Default blue links and gray text on white backgrounds
- Overused "glassmorphism" without purpose
- Cookie-cutter hero sections with centered text + big button
- Icon + title + body copy repeated identically N times
- Gradients from purple to pink (unless intentional retro aesthetic)
- Shadows that are too dark or too uniform

## Execution

1. **Orient** — read all requirements, identify the core user need
2. **Commit** — pick ONE aesthetic direction, name it explicitly
3. **Sketch** — describe the layout and key visual moments in comments
4. **Build** — write complete, working code with no placeholders
5. **Refine** — go back and elevate: spacing, type, color, motion
6. **Review** — does it look like a real product someone would pay for?

Every interface should feel like it was made by a designer who cares deeply about craft.
