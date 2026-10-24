# Component reference

The reusable UI primitives in [`src/components/`](../src/components/). Import from
`src/components/index.ts`. Token names refer to
[`src/styles/tokens.css`](../src/styles/tokens.css); rules and values are in
[style-guide.md](style-guide.md).

All components use **semantic tokens only**. They contain no hex colour, no
palette token and no off-scale spacing; `npm run lint` and `tests/tokens.test.ts`
enforce this. Behaviour is covered by `tests/components.test.tsx`.

Only primitives needed to demonstrate the system exist. Page sections (hero,
feature section, FAQ and so on) are **not** components yet; they are built in
Phase D.

## Button, ButtonLink

`src/components/Button.tsx`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'tertiary'` | `'primary'` | See below |
| `loading` | `boolean` (Button only) | `false` | Disables the button, sets `aria-busy`, shows a decorative spinner. The label stays visible |
| `disabled` | `boolean` (Button only) | `false` | Real `disabled` attribute: leaves the tab order, ignores clicks |
| `type` | button type (Button only) | `'button'` | Defaults to `button` so it never submits a form by accident |
| `href` | `string` (ButtonLink only, **required**) | n/a | Renders an `<a>`. A link without a destination is not a link |
| other props | native button / anchor attributes | n/a | `className` is appended, not a replacement |

| Variant | Use | Tokens |
|---|---|---|
| `primary` | The one dominant action. **One per hero.** | `brand-primary`, `brand-on-primary`, hover/active tokens |
| `secondary` | A quieter alternative beside a primary | `border-strong`, `surface-page`, `text-primary` |
| `tertiary` | Low-emphasis action or in-page navigation | `brand-primary` text, `surface-hover` on hover |

Use **Button** for actions (it does something) and **ButtonLink** for navigation
(it goes somewhere). Minimum height `--min-target-size`; radius `rounded-button`.

## Card

`src/components/Card.tsx`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `as` | `'div' \| 'article' \| 'section'` | `'div'` | Use `article` for self-contained content; `section` only with an accessible name |
| `variant` | `'outlined' \| 'subtle'` | `'outlined'` | `outlined`: border + `shadow-card`. `subtle`: `surface-subtle`, no border |

Padding is fixed at `space-6`; radius `rounded-card`.

## SectionContainer

`src/components/SectionContainer.tsx`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `tone` | `'page' \| 'subtle'` | `'page'` | Band background. Alternate tones down a page |
| `aria-labelledby` / `aria-label` | string | n/a | **Pass one.** A `<section>` is only a landmark when named |

Full-width band; content is bounded to `--container-content` with gutters of
`space-4` (mobile), `space-6` (md) and `space-8` (lg). Vertical padding is
`space-12`, then `space-16` from `md`.

## SectionHeading

`src/components/SectionHeading.tsx`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `level` | `1 \| 2 \| 3` | `2` | Renders `h1`/`h2`/`h3`. **Size follows level**, so choose by document outline, not by how big you want it |
| `title` | node | required | |
| `eyebrow` | string | n/a | Small brand-coloured label above the heading |
| `description` | node | n/a | Supporting paragraph in `text-secondary` |
| `align` | `'start' \| 'center'` | `'start'` | |
| `id` | string | n/a | Set it so a parent section can reference it with `aria-labelledby` |

Level to type token: 1 → `text-hero`, 2 → `text-h2`, 3 → `text-h3`.

## StatusBadge

`src/components/StatusBadge.tsx`

| Prop | Type | Default | Notes |
|---|---|---|---|
| `status` | `'green' \| 'amber' \| 'red'` | required | The three workout decision states |
| `children` | node | default label | Overrides the visible label. It must still say what the state means |

| Status | Default label | Icon shape | Tokens |
|---|---|---|---|
| `green` | Optimal zone | circle with check | `status-green-bg`, `status-green-fg` |
| `amber` | Caution zone | triangle | `status-amber-bg`, `status-amber-fg` |
| `red` | High-risk flag | circle with cross | `status-red-bg`, `status-red-fg` |

**Meaning is never carried by colour alone**: every badge has visible text and a
distinct icon shape. The icon is `aria-hidden`; a visually hidden
"Green status:" prefix tells screen-reader users the colour name. The badge
carries `data-status` for tests.

Use **only** for workout decisions. For general UI messages use the `feedback-*`
tokens.

Recommended composition (status → rationale → action), as shown in the showcase:

```tsx
<Card as="article">
  <StatusBadge status="amber" />
  <p>{rationale}</p>
  <p>{suggestedAction}</p>
</Card>
```

A dedicated `RecommendationPanel` has **not** been built; add it in Phase D if the
page needs the composition more than once.

## FormField, TextInput, Select

`src/components/FormField.tsx`

```tsx
<FormField label="Weight (kg)" hint="As logged." error={message} required>
  <TextInput type="number" />
</FormField>
```

| Prop (FormField) | Type | Notes |
|---|---|---|
| `label` | string, required | Visible `<label>` associated by `htmlFor` |
| `hint` | string | Linked via `aria-describedby` |
| `error` | string | Sets `aria-invalid`, renders an icon + `Error:` text, linked via `aria-describedby`, and thickens the border to `border-width-strong` (a second non-colour cue) |
| `required` | boolean | Sets `required` on the control and adds a visible `*` plus a hidden "(required)" |

`TextInput` and `Select` read the field's id, description, invalid and required
state from context, so they **must** be rendered inside a `FormField` (they throw
otherwise, to make an unlabelled control impossible). Their boundary uses
`--color-border-strong` (3.66:1) so the control is perceivable (WCAG 1.4.11).

## Not built, on purpose

Textarea, checkbox, radio, modal, tabs, navigation header/footer, hero, FAQ
accordion, metric card and product-screenshot components. None is supported by a
requirement of this phase.
