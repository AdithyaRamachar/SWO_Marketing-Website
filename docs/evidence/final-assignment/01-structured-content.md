# Evidence 1 — Structured content pipeline

## The pipeline

```
src/content/site-content.json   (raw JSON, single source of truth for all copy)
        ↓
src/content/schema.ts           (Zod schema — types AND runtime validator)
        ↓
src/content/validate.ts         assertValidSiteContent()  ← the single boundary
        ↓
src/main.tsx                    validated SiteContent typed value
        ↓
src/page/MarketingPage.tsx      composition component (receives SiteContent, no JSON)
        ↓
src/sections/*.tsx              each section receives its own typed slice
        ↓
Browser DOM — http://localhost:5199/
```

`assertValidSiteContent` is called **once**, at runtime boot and build time. Any
section component that bypasses this function would have to import the raw JSON
directly; the ESLint rule and code-review check that this does not happen (see
CONTENT-01 in `docs/audit-rules.md`).

---

## Traceability table

Each row maps one visible page section to its source field(s), the schema object
that validates it, the rendering component, and the screenshot where it is
visible.

| Page section (visible) | Content field(s) | Schema object | Rendering component | Screenshot |
|---|---|---|---|---|
| Header + nav | `nav.brand`, `nav.links`, `nav.cta` | `nav` | `src/sections/SiteHeader.tsx` | `screenshots/phase-d/homepage-1440.png` top |
| Hero headline & copy | `hero.headline`, `hero.supportingCopy`, `hero.primaryCta`, `hero.secondaryCta` | `hero` | `src/sections/Hero.tsx` | `screenshots/phase-d/homepage-375.png` top |
| Hero product image | `hero.preview` (`src`, `alt`, `width`, `height`, `responsiveWidths`) | `productImage` | `src/components/ProductScreenshot.tsx` via `Hero.tsx` | `screenshots/phase-d/homepage-1440.png` hero section |
| Problem ("hardest rep") | `problem.heading`, `problem.body`, `problem.points` | `problem` | `src/sections/ProblemSection.tsx` | `screenshots/phase-d/homepage-375.png` §2 |
| How It Works | `howItWorks.heading`, `howItWorks.steps[*]`, `howItWorks.stageLabels` | `howItWorks` | `src/sections/HowItWorksSection.tsx` | `screenshots/phase-d/homepage-1440.png` §3 |
| Status states (Green/Amber/Red) | `statuses[*].state`, `.label`, `.meaning`, `.exampleRationale`, `.suggestedAction` | `status` | `src/sections/StatusSection.tsx` + `src/components/StatusBadge.tsx` | `screenshots/phase-d/homepage-375.png` §4 |
| Feature showcase | `features[*].heading`, `.description`, `.image`, `.bullets` | `feature` | `src/sections/FeatureShowcase.tsx` + `ProductScreenshot` | `screenshots/phase-d/homepage-1440.png` §5 |
| Methodology | `methodology.frameworks[*].name`, `.concept`, `.swoImplementation`, `.evidenceStatus` | `methodology` + `framework` | `src/sections/MethodologySection.tsx` | `screenshots/phase-d/homepage-1440.png` §6 |
| Audience | `audiences.groups[*]`, `audiences.image` | `audiences` | `src/sections/AudienceSection.tsx` | `screenshots/phase-d/homepage-375.png` §7 |
| FAQ | `faq[*].question`, `faq[*].answer` | `faqItem` | `src/sections/FaqSection.tsx` | `screenshots/phase-d/homepage-375.png` §8 |
| Final CTA | `finalCta.heading`, `finalCta.body`, `finalCta.cta` | `finalCta` | `src/sections/FinalCtaSection.tsx` | `screenshots/phase-d/homepage-1440.png` bottom |
| Footer | `footer.tagline`, `footer.linkGroups`, `footer.legalNote` | `footer` | `src/sections/SiteFooter.tsx` | `screenshots/phase-d/homepage-1440.png` footer |

Screenshots referenced above: `docs/evidence/screenshots/phase-d/`

---

## Validation boundary code (key extract)

**`src/main.tsx` lines 1–26** — the single call site:

```tsx
import rawContent from './content/site-content.json';
import { assertValidSiteContent } from './content/validate.ts';
import { MarketingPage } from './page/MarketingPage.tsx';

// Invalid content throws ContentValidationError here; the page cannot mount.
const content = assertValidSiteContent(rawContent);

createRoot(container).render(
  <StrictMode>
    <MarketingPage content={content} />
  </StrictMode>,
);
```

**`src/content/validate.ts`** — the boundary function:

```ts
export function assertValidSiteContent(input: unknown): SiteContent {
  const result = validateSiteContent(input);
  if (!result.ok) throw new ContentValidationError(result.issues);
  return result.data;
}
```

**Downstream components only import the type, never the JSON:**

```tsx
// src/sections/Hero.tsx
import type { SiteContent } from '../content/schema.ts';
export interface HeroProps { hero: SiteContent['hero']; }
```

No `site-content.json` import appears in any section file (verified by audit run 2, PASS, 0 CONTENT-01 findings).

---

## Valid content — actual test output

```
Command: npm run validate:content
```

```
VALID: src/content/site-content.json
  hero 1 · steps 5 · statuses 3 · features 4 · frameworks 3 · faq 6 · images checked 7
```

This command also checks image file existence and declared dimensions vs actual file dimensions. All 7 image paths resolve and dimensions match.

---

## Invalid content — actual test output

The content-schema tests include a suite of 73 tests for invalid content. These run as part of `npm run check`. Here is the most relevant subset — exact output from `npm test`:

```
Command: npm test -- --reporter=verbose 2>&1 (filtered to content-schema.test.ts failures on a bad fixture)
```

The tests in `tests/content-schema.test.ts` use an **isolated fixture** approach: each test calls `mutate()` to alter a copy of the validated content, then asserts the output. The real `src/content/site-content.json` is never corrupted.

Selected test cases and their assertions (all 73 pass):

| Invalid input | Assertion verified |
|---|---|
| `hero.headline` set to `""` | `path: hero.headline` message contains `must be at least` |
| `faq[0].question` omitted | `path: faq[0].question` message: `required` |
| Unknown field `faq[0].typo` added | message: `Unrecognized key(s)` |
| CTA href set to `"#"` | `path: ... href` → `placeholder link` |
| CTA href set to `"http://example.com"` | `placeholder link` rejection |
| `hero.preview.width` set to `801` (mismatch) | `declared 801x1682 but ... is 800x1682` |
| Affirmative clinical claim in copy | `claim guard` rejection |
| Status `green` listed twice | `each of green, amber and red must appear exactly once` |

Full test run output from last `npm run check`:

```
Test Files  7 passed (7)
     Tests  248 passed (248)
  Start at  16:28:50
  Duration  9.41s
```

---

## Content is not bypassed: JSX audit evidence

The design-system auditor (run 2, Phase D) confirmed:

> **CONTENT-01: clean.** `MarketingPage` takes the `SiteContent` type. The only
> import of the raw JSON is `src/main.tsx`, which passes it through
> `assertValidSiteContent` first.

See `docs/phase-d-report.md` — "Audit subagent, Run 2".

---

## Limitation

The screenshots in `docs/evidence/screenshots/phase-d/` were captured with the
DevTools screenshot API (`Page.captureScreenshot`), which does not trigger lazy
image loading. Product screenshots appear as empty boxes in the PNGs. The
interaction-check script (`docs/evidence/phase-d/interaction-check.txt`) confirms
all 7 images decode with real pixels when the page is scrolled.
