---
name: Iron & Sand
colors:
  surface: '#191302'
  surface-dim: '#191302'
  surface-bright: '#413820'
  surface-container-lowest: '#140d00'
  surface-container-low: '#221b06'
  surface-container: '#261f09'
  surface-container-high: '#312913'
  surface-container-highest: '#3d341c'
  on-surface: '#f1e1bf'
  on-surface-variant: '#e3beb7'
  inverse-surface: '#f1e1bf'
  inverse-on-surface: '#383018'
  outline: '#aa8983'
  outline-variant: '#5a403c'
  surface-tint: '#ffb4a6'
  primary: '#ffb4a6'
  on-primary: '#660700'
  primary-container: '#fc593e'
  on-primary-container: '#5a0600'
  inverse-primary: '#b52612'
  secondary: '#c8c6c5'
  on-secondary: '#303030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#ffb77a'
  on-tertiary: '#4c2700'
  tertiary-container: '#d67a12'
  on-tertiary-container: '#432100'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a6'
  on-primary-fixed: '#3f0300'
  on-primary-fixed-variant: '#900f00'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#ffdcc2'
  tertiary-fixed-dim: '#ffb77a'
  on-tertiary-fixed: '#2e1500'
  on-tertiary-fixed-variant: '#6d3a00'
  background: '#191302'
  on-background: '#f1e1bf'
  surface-variant: '#3d341c'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is engineered for high-stakes CRM environments where clarity and authority are paramount. It balances the industrial reliability of charcoal and burnt red with the organic warmth of sand and amber. The brand personality is professional, decisive, and sophisticated.

The aesthetic follows a **Corporate Modern** approach with a heavy emphasis on information density and functional elegance. By using a dark mode base, we reduce eye strain for power users while maintaining high-contrast focal points for critical data. The design prioritizes clear hierarchies, ensuring that even in data-heavy views, the user's path is intuitive and unobstructed.

## Colors
This design system utilizes a sophisticated dark-mode palette designed for professional environments. 

- **Primary (Burnt Red):** Used for primary actions, critical alerts, and brand identity. It provides a sharp contrast against the dark background.
- **Secondary (Charcoal):** The foundation of the UI. It serves as the primary surface color for containers, sidebars, and headers.
- **Tertiary (Amber):** An accent used for warning states, pending statuses, or highlighting high-value opportunities within the CRM.
- **Neutral (Sand/Beige):** The primary text and iconography color. It offers a softer, more readable alternative to pure white, reducing glare in dark environments.
- **Background:** A deeper shade than Charcoal to provide environmental depth and separate the UI "shell" from the "canvas."

## Typography
The typography system relies exclusively on **Inter** to maintain a systematic, utilitarian feel. 

- **Headlines:** Use tighter letter spacing and heavier weights to command attention. On mobile, `headline-xl` should scale down to `28px`.
- **Body:** The standard reading size is `14px` (body-md) to allow for high information density without sacrificing legibility.
- **Labels:** Used for table headers, metadata, and small captions. These are often presented in all-caps with slight tracking to distinguish them from interactive body text.

## Layout & Spacing
The layout follows a **Fluid Grid** model built on a 4px baseline. 

- **Desktop:** A 12-column grid with 16px gutters. Sidebars are fixed at 280px, while the main content area expands.
- **Tablet:** 8-column grid with 16px gutters. Sidebars collapse into a drawer or icon-only rail.
- **Mobile:** 4-column grid with 16px margins. Content stacks vertically.

Padding within components should be purposeful: cards use `md` (16px) padding, while data tables use `sm` (8px) vertical padding for rows to maximize the "at-a-glance" data volume.

## Elevation & Depth
In this dark-mode system, depth is communicated through **Tonal Layers** rather than heavy shadows.

- **Level 0 (Background):** The darkest layer (#1A1A1A).
- **Level 1 (Surface):** The Charcoal (#242424) used for cards and main UI blocks.
- **Level 2 (Overlay):** A lighter tint of Charcoal for hover states and active navigation items.
- **Shadows:** When used (primarily for modals and dropdowns), shadows are pure black with 40% opacity and a 12px blur, creating a subtle "lift" without introducing muddy grays.
- **Outlines:** Low-contrast 1px borders using a 10% opacity version of the Sand (#DBCCAB) color are used to define the boundaries of cards and inputs.

## Shapes
The shape language is structured and professional. A standard radius of **8px** (rounded) is applied to most UI components, including buttons, input fields, and cards. This provides a modern feel that is less aggressive than sharp corners but more serious than pill-shaped designs. Large containers like main dashboard areas may use **16px** (rounded-xl) for a softer outer frame.

## Components
- **Buttons:** Primary buttons use the Burnt Red background with Sand text. Secondary buttons use a transparent background with a Sand border. The height is fixed at 40px for standard actions.
- **Inputs:** Background uses a slightly darker shade than the surface color. Borders are 1px Sand (20% opacity), turning to Burnt Red on focus.
- **Cards:** Defined by a 1px border and the Charcoal surface color. Headers within cards should have a subtle bottom border to separate titles from content.
- **Data Tables:** Zebra-striping is avoided. Instead, use thin 1px dividers. Header cells use `label-md` typography with a Sand color at 60% opacity.
- **Chips/Badges:** Small, 20px height components with a 4px radius. Use Burnt Red for "High Priority" and Amber for "In Progress," with low-opacity background fills to keep text readable.
- **Navigation Rail:** Vertical orientation on the left. Icons use Sand color, with a Burnt Red vertical "pip" on the left edge to indicate the active state.