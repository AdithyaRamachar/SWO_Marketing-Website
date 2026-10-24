# Phase D implementation checklist

Mapped to the assignment's definition of done (section 13 of the brief). Status is
updated as work lands; nothing is marked done without a command and its output.
**Final status below. Full results: [phase-d-report.md](phase-d-report.md).**

| # | Acceptance criterion | Plan | Status |
|---|---|---|---|
| D1 | Full marketing homepage implemented locally | `src/sections/*` composed by `src/page/MarketingPage.tsx`, mounted from `index.html` | **Done** |
| D2 | Visual design follows the design system | Semantic tokens only; `swo/no-raw-colour` + palette ban + `tests/tokens.test.ts` enforce | **Done**, auditor PASS |
| D3 | Responsive at 375 / 768 / 1024 / 1440 | Mobile-first utilities; `npm run capture` measures overflow at each width | **Done**, no overflow 375/768/1024/1440 |
| D4 | Supplied assets used appropriately, all paths resolve | Asset→section map below; `npm run validate:content` checks existence + dimensions | **Done**, 7/7 render |
| D5 | Content separated from layout and validated before render | `site-content.json` → `assertValidSiteContent()` → typed props. No section imports the JSON | **Done** |
| D6 | All navigation and CTAs work | In-page anchors only; anchor targets checked by the schema against `SECTION_IDS` | **Done**, 17/17 links |
| D7 | Three states distinguished without colour alone | `StatusBadge`: label text + distinct icon shape; asserted in tests | **Done** |
| D8 | Methodology claims qualified | `concept` vs `swoImplementation` split, `evidenceStatus`, disclaimer; claim guard in schema | **Done** |
| D9 | Audit run against the real implementation | `design-system-auditor` on `src/sections/` + `src/page/`, findings recorded and fixed | **Done**: FAIL 3 → fixed → PASS 0 |
| D10 | Intentional violation detected, then removed | Throwaway fixture under `docs/evidence/phase-d-audit/`, audited, then corrected | **Not done** — superseded, see report |
| D11 | Image skill used, or no-op documented honestly | `/optimize-web-images` in a fresh process for the newly needed screenshots | **Done**, 122/122 checks |
| D12 | Tests, lint, typecheck, build run | `npm run check` | **Done**, `npm run check` exit 0 |
| D13 | Evidence and documentation updated | `docs/phase-d-report.md`, `docs/evidence/README.md`, style guide, traceability matrix | **Done** |
| D14 | Token/session totals reported with limitations | `npm run track:usage`; existing ledger preserved, never reset | **Done**, provisional |
| D15 | No deployment, database or backend added | No new runtime dependencies | **Held** |

## Asset → section map (decided in preflight, from inspecting the files)

| Section | Asset | Why | Treatment |
|---|---|---|---|
| Hero | `product-screenshots/dashboard.png` | Product-led: readiness state, training-load chart, primary action. No browser chrome | crop status bar |
| Guidance states | `product-screenshots/session-end-card.png` | The only asset showing Green **and** Red together, each with a text label | crop: removes the personal profile header and the app's own download/QR row |
| Feature: exercise-level guidance | `product-screenshots/exercise-card.png` | Already optimised in Phase C | none |
| Feature: the reason beside the status | `product-screenshots/exercise-card-caution-message.png` | Already optimised in Phase C | none |
| Feature: explain the score | `product-screenshots/caution-explanation.png` | Shows the readiness/sleep/energy/ACWR breakdown | crop browser chrome |
| Feature: progression | `product-screenshots/exercise-card-progress-message.png` | Shows suggested next-set targets | crop browser chrome |
| Who it is for | `photography/workout-01.jpg` | Training in progress, no identifiable face | resize only |

Rejected, with reasons:

- `photography/workout-02.png` — visible third-party sparkle mark and gym logos.
- `photography/post-workout-01.jpg` — identifiable face of a private individual.
- `photography/landing-page-photo.png` — not needed; no section calls for it.
- `references/external-templates/*` — layout lessons only, never site assets.

Two assets carry a third-party development URL (`logic-check.lovable.app`) in a
browser bar, and one carries a personal name and profile photo. Both are removed
by cropping, which is why the image pipeline gains a crop option in this phase.
