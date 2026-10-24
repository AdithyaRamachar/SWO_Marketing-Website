# SWO Website Style Guide (v0.2)

**Status.** Design tokens are **implemented** in [`src/styles/tokens.css`](../src/styles/tokens.css), the single canonical source. This guide documents them and records which v0.1 proposals were kept, which were changed and why, and what is still unverified.

The two files are kept in step by tests (`npm test`): every token in `tokens.css` must appear in the reference table below with its exact declared value, and a documented token that no longer exists fails the build. Contrast is measured, not asserted (`npm run check:tokens`).

Component APIs are in [component-reference.md](component-reference.md). Content rules are in [content-model.md](content-model.md). Reference → rule → token → component traces are in [traceability-matrix.md](traceability-matrix.md).

## Decision status legend

| Label | Meaning |
|---|---|
| **kept** | v0.1 proposal implemented unchanged and verified where it can be |
| **adjusted** | v0.1 proposal changed after measurement; the evidence is given |
| **added** | not in v0.1; needed by the implementation |
| **proposed** | implemented as a working default but **not validated** against a real layout or user need |

Nothing marked **proposed** should be treated as a settled design decision.

## Design principles

1. **Product first:** show what SWO does before relying on lifestyle imagery.
2. **Explain the decision:** status, rationale and suggested action are visually distinct.
3. **Calm precision:** neutral canvas, confident typography, restrained accents.
4. **Evidence over hype:** explain frameworks and limits; avoid unsupported promises.
5. **Responsive by default:** content order and screenshots remain understandable on narrow screens.
6. **Accessible meaning:** status is conveyed by text and an icon shape as well as colour.

## What the references showed

Inspected before finalising tokens (IDs from [reference-catalogue.md](reference-catalogue.md)).

| Observation | Source | Effect on the system |
|---|---|---|
| The product's brand is a mid teal, with white cards on a very light cool-grey page | APP-02, APP-03, APP-06 | Confirms the teal-on-neutral direction; teal `#0F9986` is kept as `--color-brand-accent` |
| The app's primary button uses **dark text on teal**, not white | APP-02 (`Finish`) | White-on-`#0F9986` is only 3.55:1, so the website CTA uses a darker teal that supports white text |
| Status pills always combine an **icon and a text label** (`⚠ CAUTION ZONE`, `✓ GREEN`, `✕ RED`) | APP-03, APP-06 | Implemented as a rule: `StatusBadge` always renders text and a distinct icon shape |
| Cards use large, soft radii; controls are rounded | APP-02, APP-06 | `--radius-card` (1rem) and `--radius-control` kept from v0.1 |
| Recommendation panels read: status, then reason, then a suggested next target | APP-02, APP-03 | Component rule "status → rationale → action" kept |
| REF-04 (a third-party hero) is dark, saturated and gradient-heavy | REF-04 | **Layout lesson only.** Nothing from it is adopted; the SWO hero stays light and neutral |

## Token reference

Names map from v0.1 by replacing dots with dashes: `color.text.primary` is `--color-text-primary`. Values are shown exactly as declared in `tokens.css`. **Components must use semantic tokens only**: palette tokens are raw values that exist so the semantic layer has something to point at.

### Palette (raw values)

| Token | Value | Status | Purpose and usage |
|---|---|---|---|
| `--palette-neutral-0` | `#ffffff` | kept | Page canvas white. Reached through `--color-surface-page` |
| `--palette-neutral-50` | `#f5f7fa` | kept | Quiet panel background (v0.1 `surface.subtle`) |
| `--palette-neutral-100` | `#edf1f5` | added | Hover and disabled surface |
| `--palette-neutral-150` | `#e2e8ee` | added | Pressed surface |
| `--palette-neutral-200` | `#dce3ea` | kept | Decorative dividers and card borders (v0.1 `border.default`) |
| `--palette-neutral-500` | `#7b8794` | added | Control boundaries and disabled text (3.66:1 on white) |
| `--palette-neutral-600` | `#52607a` | adjusted | Secondary text. v0.1 `#64748B` |
| `--palette-neutral-900` | `#101827` | kept | Ink/navy primary text (v0.1 `text.primary`) |
| `--palette-teal-50` | `#e3f5f2` | added | Subtle brand tint |
| `--palette-teal-500` | `#0f9986` | kept | The product's own teal; decorative only (3.55:1 on white) |
| `--palette-teal-700` | `#0b7a6b` | adjusted | Brand teal that supports white text and teal text on white |
| `--palette-teal-800` | `#0a6a5c` | added | Brand hover |
| `--palette-teal-900` | `#095c50` | added | Brand pressed |
| `--palette-green-100` | `#ddf7e9` | kept | Green status background |
| `--palette-green-700` | `#077353` | adjusted | Green status foreground. v0.1 `#087F5B` |
| `--palette-amber-100` | `#fff0cc` | kept | Amber status background |
| `--palette-amber-700` | `#925600` | kept | Amber status foreground |
| `--palette-red-100` | `#fce4e4` | kept | Red status background |
| `--palette-red-700` | `#b42318` | kept | Red status foreground |
| `--palette-blue-100` | `#e0eaff` | added | Informational background |
| `--palette-blue-800` | `#1e40af` | added | Informational foreground |

### Colour (semantic)

| Token | Value | Status | Purpose and usage |
|---|---|---|---|
| `--color-text-primary` | `var(--palette-neutral-900)` | kept | Body text and headings on light surfaces |
| `--color-text-secondary` | `var(--palette-neutral-600)` | adjusted | Supporting text. Passes 4.5:1 on page, subtle and hover surfaces |
| `--color-text-inverse` | `var(--palette-neutral-0)` | added | Text on a dark surface. No dark surface exists yet |
| `--color-text-disabled` | `var(--palette-neutral-500)` | added | Disabled labels. WCAG exempts disabled controls, so this is **not** contrast-checked |
| `--color-brand-primary` | `var(--palette-teal-700)` | adjusted | Primary CTA fill, tertiary-button text, links. v0.1 was `#0F9986` |
| `--color-brand-primary-hover` | `var(--palette-teal-800)` | added | Primary button hover |
| `--color-brand-primary-active` | `var(--palette-teal-900)` | added | Primary button pressed |
| `--color-brand-on-primary` | `var(--palette-neutral-0)` | added | Label on `--color-brand-primary` |
| `--color-brand-subtle` | `var(--palette-teal-50)` | added | Quiet brand-tinted background |
| `--color-brand-accent` | `var(--palette-teal-500)` | kept | Decorative accents only (shapes, rules). **Never text**: 3.55:1 |
| `--color-surface-page` | `var(--palette-neutral-0)` | kept | Main canvas |
| `--color-surface-subtle` | `var(--palette-neutral-50)` | kept | Secondary sections and quiet panels |
| `--color-surface-hover` | `var(--palette-neutral-100)` | added | Hovered tertiary/secondary control |
| `--color-surface-pressed` | `var(--palette-neutral-150)` | added | Pressed control |
| `--color-surface-disabled` | `var(--palette-neutral-100)` | added | Disabled control fill |
| `--color-border-default` | `var(--palette-neutral-200)` | kept | Dividers and card edges. **Decorative only** (1.29:1): never as a form-control boundary |
| `--color-border-strong` | `var(--palette-neutral-500)` | added | Form-control and secondary-button boundaries (WCAG 1.4.11, 3.66:1) |
| `--color-status-green-bg` | `var(--palette-green-100)` | kept | Green (optimal) badge/panel background |
| `--color-status-green-fg` | `var(--palette-green-700)` | adjusted | Green label, icon and badge border |
| `--color-status-amber-bg` | `var(--palette-amber-100)` | kept | Amber (caution) background |
| `--color-status-amber-fg` | `var(--palette-amber-700)` | kept | Amber label, icon and badge border |
| `--color-status-red-bg` | `var(--palette-red-100)` | kept | Red (high-risk) background |
| `--color-status-red-fg` | `var(--palette-red-700)` | kept | Red label, icon and badge border |
| `--color-feedback-success-bg` | `var(--color-status-green-bg)` | added | General success feedback. Alias of the green state |
| `--color-feedback-success-fg` | `var(--color-status-green-fg)` | added | Alias of the green state |
| `--color-feedback-warning-bg` | `var(--color-status-amber-bg)` | added | General warning feedback. Alias of the amber state |
| `--color-feedback-warning-fg` | `var(--color-status-amber-fg)` | added | Alias of the amber state |
| `--color-feedback-danger-bg` | `var(--color-status-red-bg)` | added | Errors and destructive feedback. Alias of the red state |
| `--color-feedback-danger-fg` | `var(--color-status-red-fg)` | added | Error text and invalid-control border. Alias of the red state |
| `--color-feedback-info-bg` | `var(--palette-blue-100)` | added | Neutral informational message |
| `--color-feedback-info-fg` | `var(--palette-blue-800)` | added | Informational text and icon |
| `--color-focus-ring` | `var(--color-brand-primary)` | added | Keyboard focus outline (5.24:1 on page) |

**Why the feedback tokens alias the status tokens.** The system has one green, one amber and one red. Success/warning/danger feedback reuses them so the same colour never means two different things. The rule that Green/Amber/Red are decision states, not decoration, still applies: use the `feedback` names for UI messages and the `status` names for workout decisions.

### Typography

| Token | Value | Status | Purpose and usage |
|---|---|---|---|
| `--font-sans` | `Inter, ui-sans-serif, system-ui, sans-serif` | **proposed** | One sans family. **Inter is not bundled or loaded yet**, so pages currently render in the system font. Decide in Phase D whether to self-host it |
| `--font-weight-regular` | `400` | added | Body |
| `--font-weight-medium` | `500` | added | Emphasised body, error messages |
| `--font-weight-semibold` | `600` | added | Labels, buttons, card titles |
| `--font-weight-bold` | `700` | added | Headings |
| `--text-hero` | `clamp(2.75rem, 5vw, 4.5rem)` | kept | Hero headline (`text-hero`) |
| `--text-hero--line-height` | `1.05` | kept | Within v0.1's 1.05–1.2 heading range |
| `--text-h2` | `clamp(2rem, 3.2vw, 3rem)` | kept | Section headings |
| `--text-h2--line-height` | `1.15` | kept | Heading range |
| `--text-h3` | `1.25rem` | kept | Card and feature titles |
| `--text-h3--line-height` | `1.2` | kept | Heading range |
| `--text-body` | `1rem` | kept | Default body |
| `--text-body--line-height` | `1.6` | kept | Within v0.1's 1.5–1.7 body range |
| `--text-small` | `0.875rem` | kept | Labels, captions. Must still pass contrast |
| `--text-small--line-height` | `1.5` | kept | Body range |
| `--leading-heading` | `1.15` | added | Default heading leading for non-sized headings |
| `--leading-body` | `1.6` | added | Default body leading, applied to `body` |

Tailwind's default type scale (`text-sm`, `text-xl` …) is removed on purpose, so an off-system size fails to compile rather than slipping in.

### Spacing, geometry and layout

| Token | Value | Status | Purpose and usage |
|---|---|---|---|
| `--spacing` | `0.25rem` | added | Tailwind's spacing multiplier, so `p-4` equals `--space-4` |
| `--space-1` | `0.25rem` | kept | Tight inline gaps (`p-1`, `gap-1`) |
| `--space-2` | `0.5rem` | kept | Compact component spacing |
| `--space-3` | `0.75rem` | kept | Small internal gaps |
| `--space-4` | `1rem` | kept | Standard padding/gap; mobile page gutter |
| `--space-6` | `1.5rem` | kept | Card and section internal spacing |
| `--space-8` | `2rem` | kept | Larger component gaps |
| `--space-12` | `3rem` | kept | Section sub-groups; mobile section padding |
| `--space-16` | `4rem` | kept | Desktop section rhythm |
| `--radius-card` | `1rem` | kept | Cards and product-preview panels (`rounded-card`) |
| `--radius-button` | `0.625rem` | kept | Buttons (`rounded-button`) |
| `--radius-control` | `0.625rem` | added | Form controls. Same value as the button radius |
| `--radius-pill` | `9999px` | added | Status badges, matching the pills in APP-03 and APP-06 |
| `--border-width-default` | `1px` | added | Equals Tailwind's `border` |
| `--border-width-strong` | `2px` | added | Equals Tailwind's `border-2`. Used for an invalid control |
| `--shadow-card` | `0 1px 2px 0 rgb(16 24 39 / 0.06), 0 1px 3px 0 rgb(16 24 39 / 0.08)` | **proposed** | Resting card elevation. Values not derived from a reference |
| `--shadow-raised` | `0 4px 6px -1px rgb(16 24 39 / 0.08), 0 10px 24px -4px rgb(16 24 39 / 0.12)` | **proposed** | Raised surface. Not used by any component yet |
| `--container-content` | `72rem` | kept | Page content width (`max-w-content`). v0.1 `content.max-width` |
| `--container-prose` | `42rem` | **proposed** | Readable line length (`max-w-prose`) |
| `--container-screenshot` | `22rem` | **proposed** | Cap for a portrait phone screenshot (`max-w-screenshot`). Added in Phase D; sources are 864px wide and up to 1920px tall |
| `--breakpoint-sm` | `40rem` | **proposed** | v0.1 specified no breakpoints. Equals Tailwind's default |
| `--breakpoint-md` | `48rem` | **proposed** | As above |
| `--breakpoint-lg` | `64rem` | **proposed** | As above |
| `--breakpoint-xl` | `80rem` | **proposed** | As above |

The documented spacing steps are 1, 2, 3, 4, 6, 8, 12 and 16. Other numeric steps (`p-5`, `gap-10` …) still compile, because Tailwind derives them from `--spacing`; a test rejects them in components, and the design-system auditor flags them elsewhere.

### Interaction

| Token | Value | Status | Purpose and usage |
|---|---|---|---|
| `--focus-ring-width` | `3px` | **proposed** | Focus outline thickness |
| `--focus-ring-offset` | `2px` | **proposed** | Gap between element and ring, so the ring stays visible on a same-hue button |
| `--default-transition-duration` | `150ms` | **proposed** | Colour transitions. Disabled entirely under `prefers-reduced-motion` |
| `--min-target-size` | `2.75rem` | **proposed** | Minimum height of buttons and controls (44px). WCAG 2.2 AA (2.5.8) requires only 24px; 44px is a stricter, conventional touch target |

**State model.** Hover, active, focus and disabled each have a defined treatment:

| State | Treatment |
|---|---|
| Hover | Primary: `--color-brand-primary-hover`. Secondary and tertiary: `--color-surface-hover` |
| Active (pressed) | Primary: `--color-brand-primary-active`. Others: `--color-surface-pressed` |
| Focus-visible | `--focus-ring-width` solid `--color-focus-ring`, offset `--focus-ring-offset`, applied globally in `src/styles/index.css` |
| Disabled | `--color-surface-disabled` fill, `--color-text-disabled` text, `cursor-not-allowed`, never a hover colour. Real `disabled` attribute, so the control leaves the tab order |
| Invalid | `--border-width-strong` border in `--color-feedback-danger-fg`, **plus** an icon and message text |

## Contrast evidence (WCAG 2.2)

Computed from the live tokens by `npm run check:tokens`; the same pairs are asserted in `tests/tokens.test.ts`. Text needs 4.5:1; UI boundaries and focus indicators need 3:1.

| Pair | Foreground | Background | Ratio | Required | Result |
|---|---|---|---:|---:|---|
| Body and headings on the page canvas | `--color-text-primary` #101827 | `--color-surface-page` #ffffff | 17.77 | 4.5:1 | pass |
| Body and headings on quiet panels | `--color-text-primary` #101827 | `--color-surface-subtle` #f5f7fa | 16.55 | 4.5:1 | pass |
| Supporting text on the page canvas | `--color-text-secondary` #52607a | `--color-surface-page` #ffffff | 6.34 | 4.5:1 | pass |
| Supporting text on quiet panels | `--color-text-secondary` #52607a | `--color-surface-subtle` #f5f7fa | 5.91 | 4.5:1 | pass |
| Supporting text on a hovered surface | `--color-text-secondary` #52607a | `--color-surface-hover` #edf1f5 | 5.58 | 4.5:1 | pass |
| Primary button label | `--color-brand-on-primary` #ffffff | `--color-brand-primary` #0b7a6b | 5.24 | 4.5:1 | pass |
| Primary button label, hover | `--color-brand-on-primary` #ffffff | `--color-brand-primary-hover` #0a6a5c | 6.50 | 4.5:1 | pass |
| Primary button label, pressed | `--color-brand-on-primary` #ffffff | `--color-brand-primary-active` #095c50 | 7.90 | 4.5:1 | pass |
| Tertiary button label and links on the page | `--color-brand-primary` #0b7a6b | `--color-surface-page` #ffffff | 5.24 | 4.5:1 | pass |
| Links on quiet panels | `--color-brand-primary` #0b7a6b | `--color-surface-subtle` #f5f7fa | 4.88 | 4.5:1 | pass |
| Tertiary button label, hover | `--color-brand-primary` #0b7a6b | `--color-surface-hover` #edf1f5 | 4.61 | 4.5:1 | pass |
| Brand text on a tinted background | `--color-brand-primary` #0b7a6b | `--color-brand-subtle` #e3f5f2 | 4.64 | 4.5:1 | pass |
| Green status label | `--color-status-green-fg` #077353 | `--color-status-green-bg` #ddf7e9 | 5.17 | 4.5:1 | pass |
| Amber status label | `--color-status-amber-fg` #925600 | `--color-status-amber-bg` #fff0cc | 5.23 | 4.5:1 | pass |
| Red status label | `--color-status-red-fg` #b42318 | `--color-status-red-bg` #fce4e4 | 5.43 | 4.5:1 | pass |
| Informational message | `--color-feedback-info-fg` #1e40af | `--color-feedback-info-bg` #e0eaff | 7.22 | 4.5:1 | pass |
| Green text or icon directly on the page | `--color-status-green-fg` #077353 | `--color-surface-page` #ffffff | 5.86 | 4.5:1 | pass |
| Amber text or icon directly on the page | `--color-status-amber-fg` #925600 | `--color-surface-page` #ffffff | 5.91 | 4.5:1 | pass |
| Red text or icon, e.g. a form error message | `--color-status-red-fg` #b42318 | `--color-surface-page` #ffffff | 6.57 | 4.5:1 | pass |
| Form-control boundary (WCAG 1.4.11) | `--color-border-strong` #7b8794 | `--color-surface-page` #ffffff | 3.66 | 3:1 | pass |
| Keyboard focus indicator on the page | `--color-focus-ring` #0b7a6b | `--color-surface-page` #ffffff | 5.24 | 3:1 | pass |
| Keyboard focus indicator on quiet panels | `--color-focus-ring` #0b7a6b | `--color-surface-subtle` #f5f7fa | 4.88 | 3:1 | pass |
| Decorative accent shapes only; NOT for text | `--color-brand-accent` #0f9986 | `--color-surface-page` #ffffff | 3.55 | 3:1 | pass |

### Changes made to v0.1 values, with the measurement behind each

| v0.1 value | Measured problem | Change |
|---|---|---|
| `color.text.secondary` `#64748B` | 4.76:1 on white but **4.43:1 on `surface.subtle`**, failing AA for body text | `#52607A` (6.34 / 5.91) |
| `color.brand.primary` `#0F9986` | White label on it is **3.55:1**; the colour as text on white is also 3.55:1 | `#0B7A6B` (5.24:1). `#0F9986` is kept as the decorative `--color-brand-accent` |
| `color.status.green.fg` `#087F5B` | **4.42:1** on its own background, 0.08 below AA | `#077353` (5.17:1) |
| `color.border.default` `#DCE3EA` | 1.29:1 against white. Fine for dividers, **not** for a form-control boundary under WCAG 1.4.11 | Kept for decoration; added `--color-border-strong` (3.66:1) for controls |

Amber (5.23:1) and red (5.43:1) passed unchanged.

## Component rules

- **Primary CTA:** `--color-brand-primary` fill with `--color-brand-on-primary` text, a clear action label, visible focus, a hit area of at least `--min-target-size`. One primary CTA per hero.
- **Secondary CTA:** outlined with `--color-border-strong`, visually quieter than the primary. Never two primary buttons competing.
- **Feature section:** pair a concise heading and explanatory copy with one meaningful screenshot; alternate layout direction.
- **Product preview:** preserve screenshot aspect ratio, avoid cropping essential UI text, give descriptive alt text, declare `width` and `height`, and label illustrative content.
- **RAG status badge:** text label **and** a distinct icon shape; colour alone is never sufficient.
- **Recommendation panel:** present status, rationale, then suggested action, in that order.
- **Metrics:** label, value, and unit or context.
- **Forms:** every control has a visible label; hints and errors are programmatically associated; an error is shown with an icon and text, never colour alone.
- **FAQ/help links:** clear labels, and only real destinations.

## Responsive rules

- Mobile first. On narrow screens, stack text and media vertically, text first.
- Never require horizontal scrolling. Measured on the showcase and content demo at 1280, 768 and 390px by `npm run capture`: no overflow at any of them.
- Body copy stays comfortably readable; buttons and controls stay at least `--min-target-size` tall.
- Screenshots stay legible; crop only when the crop hides nothing essential.
- Honour `prefers-reduced-motion` (implemented globally).

## Accessibility and trust

- Maintain WCAG AA contrast for text, verified against actual token pairs.
- Visible keyboard focus on every interactive element (global rule), semantic headings and landmarks.
- Convey Green/Amber/Red with label and icon shape, never colour alone.
- Do not claim medical diagnosis, injury prediction, clinical validation, guaranteed results or customer outcomes without substantiation. `src/content/schema.ts` rejects the most direct forms of these claims; see [content-model.md](content-model.md) for what that guard cannot catch.
- Distinguish published sports-science frameworks from SWO's own algorithm and product behaviour. The content schema makes both fields required for every framework.

## Still unverified

- **Typeface.** Inter is named but not loaded.
- **Breakpoints, shadows, focus-ring size.** Working defaults, not checked against a built page layout.
- **Contrast of imagery.** Text placed over photographs has not been designed yet, so no photo-overlay contrast is claimed.
- **Dark mode.** Not designed or implemented.
- **Real-device and screen-reader testing.** Only automated checks and a headless-browser capture have been run. No assistive technology has been used.
