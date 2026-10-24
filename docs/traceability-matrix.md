# Design-System Traceability Matrix

The required chain: **reference → documented rule → token → component → verification.**

Updated at the end of Phase C. Phase C built the token layer, six primitives, the
content model and the tooling; it did **not** build page sections. A row is therefore
only fully **verified** where every link in its chain exists and has been checked.
Everything else is marked **partial** or **not started**, with what is missing.

| Status | Meaning |
|---|---|
| **Verified** | Every link exists and the verification column was actually performed |
| **Partial** | Tokens and/or primitives exist and are tested; the named page component does not exist yet |
| **Not started** | Nothing in the chain is built; planned for Phase D |

## Matrix

| ID | Reference | Style-guide rule | Token(s) | Component | Status | Verification performed / outstanding |
|---|---|---|---|---|---|---|
| TR-01 | `REF-04` marketing hero | Product-first hero, strong headline, one dominant CTA | `--text-hero`, `--color-text-primary`, `--color-brand-primary`, `--container-content` | `SectionHeading` (level 1), `ButtonLink`, `SectionContainer` exist; `HeroSection` does not | **Partial** | Primitives tested (`tests/components.test.tsx`); hero composition rendered from validated content in `dev/content-demo.html`. **Outstanding:** a real `HeroSection` and its desktop/mobile review (Phase D) |
| TR-02 | `REF-01`, `APP-02` | Product preview preserves UI and pairs status with rationale | `--radius-card`, `--color-border-default`, `--color-status-green-*` | `StatusBadge`, `Card` exist; `ExercisePreview` does not | **Partial** | `StatusBadge` + `Card` composition shown in the showcase and tested. See the end-to-end trace below. **Outstanding:** `ExercisePreview` and screenshot cropping decisions (Phase D) |
| TR-03 | `REF-02`, `APP-01` | Alternate feature sections; explain dashboard metrics in context | `--space-8`, `--space-16`, `--color-text-secondary` | `FeatureSection`, `DashboardPreview` do not exist | **Not started** | The content demo alternates image side from `imageSide` data, but as a demo only. **Outstanding:** both components (Phase D) |
| TR-04 | `APP-03`, `APP-05` | Caution state: status, rationale, action; not colour alone | `--color-status-amber-*`, `--space-4`, `--radius-card` | `StatusBadge` (amber), `Card`; `RecommendationPanel` does not exist | **Partial** | Amber badge has text + triangle icon (tested); contrast 5.23:1 (`npm run check:tokens`); status → rationale → action order shown in showcase and content demo; schema requires all three. **Outstanding:** `RecommendationPanel` |
| TR-05 | `APP-06` | Session summary presents outcome and statuses clearly | `--color-status-green-*`, `--color-status-amber-*`, `--color-status-red-*` | `StatusBadge` ×3; `SessionSummaryPreview` does not exist | **Partial** | All three states render a readable label and distinct icon (tested). **Outstanding:** the summary component |
| TR-06 | `REF-05`, `REF-06` | Benefits are distinct and supported by relevant product visuals | `--text-h3`, `--space-6`, `--radius-card` | `Card`, `SectionHeading` (level 3); `ValueFeatureCard` does not exist | **Partial** | `features` content validates against the schema and renders in the demo (`tests/content-schema.test.ts`, `tests/content-render.test.tsx`). **Outstanding:** `ValueFeatureCard` |
| TR-07 | `REF-07` | Scientific claims distinguish framework, implementation and evidence | `--text-body`, `--leading-body`, `--color-text-secondary` | `Card`; `ScienceSection`, `SourceLink` do not exist | **Partial** | The schema makes `concept` and `swoImplementation` **both required** per framework, requires a source whenever `evidenceStatus` is `sourced`, rejects unsupported claims, and the demo renders the two separately. **Outstanding:** editorial review. **No source has been verified**, so every framework is `framework-description-only` |
| TR-08 | `REF-08`, PHOTO assets | Photography supports the message and keeps text contrast | `--container-content`, `--radius-card` | `TrainingPhotoSection` does not exist | **Partial** | Two photographs optimised and verified (`docs/evidence/image-optimization/`). **Outstanding:** the section, crop review, and the open questions about `workout-02` (visible sparkle mark; third-party logos) |
| TR-09 | `REF-03` | Help links have clear labels and real destinations | `--text-body`, `--space-4` | `ButtonLink`; `FAQSection`, `FooterLink` do not exist | **Partial** | The link schema rejects `#`, empty, `javascript:`, `mailto:`/`tel:`, `http:` and placeholder hosts, and checks anchors resolve to a section (`tests/content-schema.test.ts`). **Outstanding:** FAQ/footer components; no confirmed contact channel exists |
| TR-10 | Style guide: "Accessibility and trust" (no external reference; derived from WCAG 1.4.11, 3.3.1) | Form controls have visible labels, strong boundaries and non-colour error cues | `--color-border-strong`, `--color-feedback-danger-fg`, `--border-width-strong`, `--min-target-size` | `FormField`, `TextInput`, `Select` | **Verified** | Label association, `aria-describedby`, `aria-invalid`, required and error-with-icon asserted (`tests/components.test.tsx`); boundary contrast 3.66:1 measured. **Not verified:** use with a real screen reader |
| TR-11 | `APP-02`, `APP-03`, `APP-06` observations | Tokens are implemented once, documented, and kept in sync | every token in `src/styles/tokens.css` | n/a (token layer) | **Verified** | `tests/tokens.test.ts` fails if any token is undocumented, any documented value differs from `tokens.css`, or any contrast pair drops below WCAG AA |

## End-to-end proof: `StatusBadge` (Green)

The brief asks for at least one complete trace. This one was followed link by link
against the real files.

| Link | Evidence |
|---|---|
| **Reference** | `APP-02` (`references/product-screenshots/exercise-card.png`), listed at [reference-catalogue.md:24](reference-catalogue.md). The screenshot shows a green recommendation. `APP-03` and `APP-06` show status pills that pair an icon with a text label (`⚠ CAUTION ZONE`, `✓ GREEN`, `✕ RED`) |
| **Documented rule** | [style-guide.md:231](style-guide.md): *"RAG status badge: text label **and** a distinct icon shape; colour alone is never sufficient."* Also "Accessible meaning" principle 6 |
| **Token definition** | [src/styles/tokens.css:100-101](../src/styles/tokens.css): `--color-status-green-bg: var(--palette-green-100)` and `--color-status-green-fg: var(--palette-green-700)`, resolving to `#ddf7e9` and `#077353`. The v0.1 foreground `#087F5B` measured 4.42:1 and was **adjusted** to `#077353` (5.17:1); see the style guide's "Changes made to v0.1 values" |
| **Contrast check** | [scripts/lib/contrast.ts:149](../scripts/lib/contrast.ts) pair `status-green`: 5.17:1 against the 4.5:1 requirement, from `npm run check:tokens` (23/23 pairs pass) |
| **Component** | [src/components/StatusBadge.tsx:19](../src/components/StatusBadge.tsx) maps `green` to `CircleCheck`, the label "Optimal zone", and the classes `bg-status-green-bg text-status-green-fg border-status-green-fg` |
| **Rendered** | `dev/showcase.html`, section "Workout status" (screenshots in `docs/evidence/screenshots/`) |
| **Test** | [tests/components.test.tsx:111](../tests/components.test.tsx) asserts the visible text and the hidden "Green status:" prefix; `:122` asserts the three icon shapes differ; `:132` asserts the token classes |

Reproduce: `npm run check:tokens`, `npm test`, `npm run dev`, open `/dev/showcase.html`.

**What this trace does not prove:** that the badge is easy to understand for a real
colour-blind user, or that it works with a screen reader. Neither was tested.
