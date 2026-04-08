# Agent Handover: Jade Air Dense System Migration (v3.0)

## Context for the Next Agent
We are migrating the UI-UX from an older version of Ruta Azteca to a specialized, high-contrast, professional system called **"Jade Air Dense"**. Your goal is to maintain this premium aesthetic while ensuring 100% mobile accessibility.

## Immediate Action Required
1.  **Open [STYLE_GUIDE.md](file:///c:/Users/raulf/Desktop/Ruta%20azteca/ruta-azteca/STYLE_GUIDE.md)**: Locate the **CSS Blueprint** section.
2.  **Initialize `globals.css`**: You MUST ensure the design tokens and semantic classes (`.input-jade-premium`, `.glass-card`, etc.) are present in the new project.
3.  **Check [FRONTEND_BOUNDARIES.md](file:///c:/Users/raulf/Desktop/Ruta%20azteca/ruta-azteca/FRONTEND_BOUNDARIES.md)**: These are the behavioral rules. You are forbidden from using inline styles for design-system properties.

## Critical Technical Architecture
-   **Mobile Scaling**: ALL form inputs MUST use `text-size: 16px` to prevent automatic zoom on iOS devices. Use the `.input-jade-premium` class.
-   **Map Logic**: The Map implementation uses a `MapViewHandle` (ref) for drawing routes. Do not simplify the component interaction logic.
-   **Design Tokens**: Use CSS variables for everything. If you need to change the brand color, do it in `globals.css :root` only.

## "Clean Design" Directive
If you find `style={{ ... }}` blocks in the code with colors, padding, or borders that should be part of the design system, **your first task is to refactor them** into semantic classes in `globals.css`.

Good luck, Agent. Keep it premium.
