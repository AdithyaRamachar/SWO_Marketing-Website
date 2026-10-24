# SWO Website — Claude Code Project Context

## Mission
Build a responsive, product-first public marketing landing page for Smart Workout Optimizer (SWO) in this standalone repository.

## Before coding
1. Read `README.md` and every relevant file in `docs/`.
2. Inspect the supplied images in `references/`; do not substitute unrelated/generated screenshots for authentic SWO UI.
3. Check the current project files and toolchain before choosing or changing the stack.
4. Keep work limited to the frontend/design system, structured content, subagent creation, and custom skill creation.
5. Token tracking is implemented and verified — see **Token tracking** below. Do not claim a token figure without re-running the collector.

## Current state (Phase B complete)
Phases run in order, each gated on user approval:

| Phase | Status |
|---|---|
| A — inspect and plan | Complete |
| B — toolchain bootstrap + token/session tracking | **Complete and verified** |
| C — design tokens, component specs, content schema, subagent, skill | Not started (awaiting approval) |
| D — landing-page implementation | Not started (requires a separate instruction) |

No application code, design tokens or page sections exist yet. `src/` has not
been created. Do not start Phase C or D work without explicit instruction.

## Toolchain (verified on this machine)
Windows 11 · Node v26.2.0 · npm 12.2.1 · Git 2.55 · Claude Code 2.1.153.
Node runs TypeScript natively, so `scripts/*.ts` execute without a loader.

Installed so far: `typescript`, `vitest`, `@types/node`. Phase C adds React,
Vite, Tailwind, Zod, lucide-react and sharp. Ask before adding anything else.

## Commands
```bash
npm run track:usage   # collect Claude Code token/session usage -> tracking/
npm test              # Vitest suite (17 tests, synthetic fixtures)
npm run typecheck     # tsc --noEmit
```

## Token tracking
`scripts/track-usage.ts` parses Claude Code's local JSONL session transcripts in
`~/.claude/projects/e--Projects-Airtribe-PM-SWO-Project` and writes
`tracking/usage-ledger.json`, `tracking/usage-ledger.csv` and
`tracking/usage-summary.md`. Parsing logic lives in `scripts/lib/usage-parse.ts`.

Essentials before touching or quoting it:

- **Deduplicate by `requestId`.** One API response is written as several
  assistant lines sharing one identical `usage` object. Summing lines inflated
  real totals ~2.2×. This is the collector's core correctness property.
- `total_tokens = input + output + cache_creation + cache_read`. These four are
  disjoint as reported, so cache reads are counted once.
- `thinking_tokens` is a **subset** of `output_tokens`; never add it.
- Nothing is ever estimated from characters or words. Missing fields are `null`,
  never `0`.
- Read-only on `~/.claude`; writes only to `tracking/`. Stores no prompt text,
  code or credentials.
- Known gaps: subscription-level `/usage` is not machine-readable; other project
  directories are out of scope; session end times are inferred, not reported.

Full field definitions, limitations and verification evidence:
[docs/token-tracking.md](docs/token-tracking.md). Uncollectable sessions go in
[tracking/manual-sessions.md](tracking/manual-sessions.md) — never hand-edit the
generated ledger, and never invent historical usage.

## Known documentation defect (unresolved, for Phase C)
`docs/asset-manifest.json` and `docs/reference-catalogue.md` list
`references/photography/landing-page-photo.jpg` and `workout-02.jpg`, but those
files are `.png` on disk. The documentation is wrong, not the assets. Fix the
docs in Phase C; never rename or overwrite a reference asset.

## Product facts
SWO is a wearable-free, mobile-first training decision-support app. It uses sleep quality, fatigue/stiffness, and workout performance history with training frameworks to provide exercise-level Green / Amber / Red guidance. Public name: Smart Workout Optimizer (SWO). “Training Decision Validator” is an internal project/assignment label, not the public brand.

## Design direction
- Product-first hero on a light/neutral background.
- Ink/navy text, restrained teal accent, cool neutral surfaces.
- Use real supplied SWO screenshots as product previews.
- Use personal gym photography selectively in supporting sections.
- Use Green / Amber / Red only as semantic decision states, not decoration.
- Keep layouts spacious and alternate text/image sections.
- Design mobile-first and maintain readable contrast and keyboard accessibility.
- Do not copy competitor branding, wording, or assets into the implementation.

## Content and claims
- Primary audience: individual gym-goers and serious lifters.
- Explain recommendation rationale alongside status.
- Distinguish sports-science concepts from SWO's own implementation.
- Do not invent testimonials, adoption metrics, scientific validation, medical claims, or support channels.
- Do not imply the marketing mockups are a live connected product.

## Acceptance tests
- Design tokens trace to explicit rules in `docs/style-guide.md` and a reference in `docs/reference-catalogue.md`.
- Structured content validates against a declared schema/rule set and renders correctly.
- The design-system subagent catches three planted violations and cites exact rules.
- A fresh Claude Code session understands the project from this file without foundational re-explanation.
- A custom skill is applied to a real task with before/after evidence.
- Keep a clear record of decisions, validation results, and evidence.
- Token/session totals come from `npm run track:usage`; re-run it before quoting a figure rather than reusing a number from a document.

## Working principles
- Prefer small, reusable components over duplicated page-specific styles.
- Avoid arbitrary one-off values where a documented token exists.
- Do not claim tests passed unless they were actually run and results observed.
- Ask before expanding scope or introducing dependencies that materially change the project.
