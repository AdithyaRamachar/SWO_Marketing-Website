# Design-system audit rules

The rule catalogue used by the `design-system-auditor` subagent
([.claude/agents/design-system-auditor.md](../.claude/agents/design-system-auditor.md)).
Every audit finding must cite one of these IDs plus the source document that
establishes the rule. If a problem does not fit a rule here, report it as an
**uncertain observation**, not a confirmed violation.

Sources: [style-guide.md](style-guide.md) (tokens and component rules),
[component-reference.md](component-reference.md) (component APIs),
[content-model.md](content-model.md) (content rules), and the canonical token
file [src/styles/tokens.css](../src/styles/tokens.css).

**Severity.** *High*: breaks accessibility, trust or the single token source.
*Medium*: breaks a documented convention. *Low*: minor drift.

## Colour

| ID | Rule | Source | Severity |
|---|---|---|---|
| DS-COLOR-01 | No hard-coded colour (hex, `rgb()`, `hsl()`, named colour, Tailwind arbitrary `[#…]`) in components. Use a semantic token. | style-guide.md, "Token reference → Colour"; tokens.css | High |
| DS-COLOR-02 | Components use semantic tokens only: no `--palette-*` reference and no default-Tailwind colour utility (`bg-red-500`, `text-gray-600`). | style-guide.md, "Token reference" intro | High |
| DS-COLOR-03 | `--color-brand-accent` is decorative. It must not colour text (3.55:1). | style-guide.md, `--color-brand-accent` | Medium |
| DS-COLOR-04 | `--color-border-default` is decorative. A form-control or button boundary must use `--color-border-strong`. | style-guide.md, `--color-border-default` | Medium |
| DS-STATE-01 | Green, Amber and Red are decision states, not decoration. They must not be used for branding, emphasis or ornament, i.e. where **no workout decision is being shown**. An indicator that *does* show a decision state but lacks a label or icon is **A11Y-01**, not this rule. | style-guide.md, "Design principles" and "Colour (semantic)" | High |
| DS-STATE-02 | Use `status-*` tokens for workout decisions and `feedback-*` tokens for UI messages. Do not use a green/amber/red token to mean something other than its state. | style-guide.md, "Why the feedback tokens alias the status tokens" | Medium |

## Spacing, geometry and typography

| ID | Rule | Source | Severity |
|---|---|---|---|
| DS-SPACE-01 | Spacing uses the documented steps (1, 2, 3, 4, 6, 8, 12, 16). No arbitrary `px`/`rem` values and no other numeric steps (`p-5`, `gap-10`). | style-guide.md, "Spacing, geometry and layout" | Medium |
| DS-TYPE-01 | Type uses the documented scale (`text-hero`, `text-h2`, `text-h3`, `text-body`, `text-small`) and `font-sans`. No arbitrary font size, `font-family`, or inline `fontSize`. | style-guide.md, "Typography" | Medium |
| DS-RADIUS-01 | Radius uses `rounded-card`, `rounded-button`, `rounded-control` or `rounded-pill`. No arbitrary radius. | style-guide.md, "Spacing, geometry and layout" | Low |
| DS-SHADOW-01 | Shadow uses `shadow-card` or `shadow-raised`. No arbitrary box-shadow. | style-guide.md, "Spacing, geometry and layout" | Low |

## Components

| ID | Rule | Source | Severity |
|---|---|---|---|
| DS-COMP-01 | Do not hand-build a pattern an existing component provides (button, card, badge, section container/heading, form field). Reuse it. | component-reference.md | Medium |
| DS-COMP-02 | Use only the documented variants and props of a component. No ad-hoc class overrides that recreate a different variant. | component-reference.md | Medium |

## Accessibility

| ID | Rule | Source | Severity |
|---|---|---|---|
| A11Y-01 | Status is never conveyed by colour alone. A Green/Amber/Red indicator needs a text label **and** an icon shape. Use `StatusBadge`. | style-guide.md, "Component rules → RAG status badge"; "Accessibility and trust" | High |
| A11Y-02 | Every form control has a visible label programmatically associated with it (`FormField`). Errors are text plus an icon, associated with the control. | style-guide.md, "Component rules → Forms" | High |
| A11Y-03 | Interactive elements are real `button`/`a` elements, keyboard operable, with a visible focus indicator. No `onClick` on a `div`/`span`; no `outline: none` without a replacement. | style-guide.md, "Accessibility and trust" | High |
| A11Y-04 | Every `img` has meaningful `alt` text, plus `width` and `height`. Decorative images use `alt=""`. | style-guide.md, "Component rules → Product preview" | High |
| A11Y-05 | Headings follow a logical order. A `section` used as a landmark has an accessible name (`aria-labelledby`/`aria-label`). | component-reference.md, `SectionContainer` | Medium |
| A11Y-06 | Interactive targets are at least `--min-target-size` (2.75rem) tall. | style-guide.md, `--min-target-size` | Medium |
| A11Y-07 | No placeholder link (`href="#"`, empty, `javascript:`) and no link without a real destination. | style-guide.md, "Component rules → FAQ/help links" | Medium |

## Responsive layout

| ID | Rule | Source | Severity |
|---|---|---|---|
| RESP-01 | Layout is mobile-first and never forces horizontal scrolling: no fixed pixel widths on containers, no `w-screen`/`min-w-[…]` wider than a phone, stacked on narrow screens with breakpoint prefixes widening it. | style-guide.md, "Responsive rules" | Medium |
| RESP-02 | Media keeps its aspect ratio and declares `width`/`height`. Do not crop essential UI text. | style-guide.md, "Responsive rules" | Low |

## Content

| ID | Rule | Source | Severity |
|---|---|---|---|
| CONTENT-01 | Marketing content is rendered only after `validateSiteContent()`. Components take the validated `SiteContent` type; they must not import `site-content.json` or a literal and render it directly. | content-model.md, "The boundary" | High |
| CONTENT-02 | No unsupported claims or fabricated trust signals: no testimonials, user counts, endorsements, guaranteed outcomes, injury prediction/prevention, clinical or scientific validation, or medical claims. | CLAUDE.md "Content and claims"; content-model.md | High |
| CONTENT-03 | Marketing copy is not hard-coded in JSX. Headings, paragraphs, CTAs, FAQ and feature text come from structured content. | content-model.md, "Why structured content" | Medium |
| CONTENT-04 | Do not imply the mockups are a live connected product. | CLAUDE.md "Content and claims" | Medium |

## One defect, one finding

Report each underlying defect once, under the **most specific** rule that owns it.
Do not file the same line again under a broader or neighbouring rule. For example, a
hand-built colour-only status dot is A11Y-01. Mention that `StatusBadge` would fix it
in the recommended fix; raise DS-COMP-01 separately only when a pattern is duplicated
and has **no** accessibility or token defect of its own.

## What this catalogue cannot decide

Whether a sentence is *true*, whether a design *looks* right, or whether
real assistive technology works. The auditor reads code. It does not run it, and
it must say so.
