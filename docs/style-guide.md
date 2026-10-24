# SWO Website Style Guide (Proposed v0.1)

Status: initial design hypothesis. Validate against the supplied reference screenshots before implementation; do not treat proposed values as observations from competitors.

## Design principles
1. **Product first:** show what SWO does before relying on lifestyle imagery.
2. **Explain the decision:** status, rationale, and suggested action should be visually distinct.
3. **Calm precision:** neutral canvas, confident typography, restrained accents.
4. **Evidence over hype:** explain frameworks and limits; avoid unsupported promises.
5. **Responsive by default:** content order and screenshots remain understandable on narrow screens.
6. **Accessible meaning:** status is conveyed by text/icon as well as colour.

## Proposed colour tokens

| Token | Proposed value | Rule / intended use |
|---|---|---|
| `color.text.primary` | `#101827` | Main text and high-priority headings on light surfaces |
| `color.text.secondary` | `#64748B` | Supporting text; do not use for small text where contrast is insufficient |
| `color.brand.primary` | `#0F9986` | Primary brand accent and main CTA; verify contrast with foreground |
| `color.surface.page` | `#FFFFFF` | Main marketing canvas |
| `color.surface.subtle` | `#F5F7FA` | Secondary section backgrounds and quiet panels |
| `color.border.default` | `#DCE3EA` | Dividers and component boundaries |
| `color.status.green.bg` | `#DDF7E9` | Positive/optimal status background |
| `color.status.green.fg` | `#087F5B` | Green status text/icon |
| `color.status.amber.bg` | `#FFF0CC` | Caution status background |
| `color.status.amber.fg` | `#925600` | Amber status text/icon |
| `color.status.red.bg` | `#FCE4E4` | High-risk status background |
| `color.status.red.fg` | `#B42318` | Red status text/icon |

Status tokens are semantic. Do not use green/amber/red as arbitrary decoration. Validate text contrast before implementation; adjust tokens if necessary and update this table.

## Proposed typography

| Token | Proposed value | Rule |
|---|---|---|
| `font.family.sans` | `Inter, ui-sans-serif, system-ui, sans-serif` | Use one consistent sans-serif family |
| `font.size.hero` | `clamp(2.75rem, 5vw, 4.5rem)` | Large hero headline, compact line length |
| `font.size.h2` | `clamp(2rem, 3.2vw, 3rem)` | Section headlines |
| `font.size.h3` | `1.25rem` | Feature/card titles |
| `font.size.body` | `1rem` | Default body text |
| `font.size.small` | `0.875rem` | Supporting labels; maintain contrast |
| `line-height.heading` | `1.05–1.2` | Tight, readable display headings |
| `line-height.body` | `1.5–1.7` | Comfortable paragraph reading |

## Proposed spacing and geometry

| Token | Proposed value | Rule |
|---|---|---|
| `space.1` | `0.25rem` | Tight inline gaps |
| `space.2` | `0.5rem` | Compact component spacing |
| `space.3` | `0.75rem` | Small internal gaps |
| `space.4` | `1rem` | Standard component padding/gap |
| `space.6` | `1.5rem` | Card/section internal spacing |
| `space.8` | `2rem` | Larger component gaps |
| `space.12` | `3rem` | Section sub-groups |
| `space.16` | `4rem` | Desktop section rhythm |
| `radius.card` | `1rem` | Product preview panels and feature cards |
| `radius.button` | `0.625rem` | Primary and secondary buttons |
| `content.max-width` | `72rem` | Keep long text and page content bounded |

Use tokens rather than arbitrary values for shared component styling. Add responsive spacing tokens only when supported by the final layout.

## Component rules
- **Primary CTA:** use `color.brand.primary`, a clear action label, visible focus state, and adequate hit area. Verify foreground contrast.
- **Secondary CTA:** visually quieter than the primary action; do not create competing primary buttons in one hero.
- **Feature section:** pair a concise heading and explanatory copy with one meaningful screenshot/visual; alternate layout direction where appropriate.
- **Product preview:** preserve screenshot aspect ratio, avoid cropping important UI text, use descriptive alt text, and label illustrative/demo content where needed.
- **RAG status badge:** include status text and an icon/shape cue; colour alone is insufficient.
- **Recommendation panel:** present status, rationale, and suggested action in that order.
- **Metrics:** display label, value, and unit/context; do not rely on a number without explanation.
- **FAQ/help links:** use clear labels and only point to real destinations.

## Responsive rules
- On narrow screens, stack text and media vertically with text first unless the content order demands otherwise.
- Never require horizontal scrolling for page content.
- Keep body copy comfortably readable and buttons easy to tap.
- Ensure product screenshots remain legible; allow a dedicated crop only when the crop does not hide essential information.
- Check reduced-motion preferences if motion is added.

## Accessibility and trust
- Maintain WCAG AA contrast for text where practical and verify actual foreground/background pairs.
- Provide keyboard focus indicators and semantic headings.
- Convey RAG status with label and icon, not colour alone.
- Do not claim medical diagnosis, injury prediction, clinical validation, guaranteed results, or customer outcomes without substantiation.
- Distinguish published sports-science frameworks from SWO's own algorithm and product behaviour.
