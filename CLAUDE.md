# SWO Website — Claude Code Project Context

## Mission
Build a responsive, product-first public marketing landing page for Smart Workout Optimizer (SWO) in this standalone repository. This is also an evidence-backed assignment: each reusable tool must be **exercised**, not just created.

## Read first, every session
1. This file, then `README.md` and the docs below as relevant.
2. Run `git status` and `git branch --show-current`. Work happens on **`dev`**; `main` is the reviewed baseline (remote `origin` = GitHub `SWO_Marketing-Website`). Do not merge without being asked.
3. Do not claim a test, check, skill or subagent works unless you ran it and saw the result.
4. Ask before expanding scope or adding dependencies that materially change the project.

## Product and audience
SWO is a wearable-free, mobile-first training decision-support app. It uses sleep quality, fatigue/stiffness and workout performance history with training frameworks to give exercise-level **Green / Amber / Red** guidance. Public name: Smart Workout Optimizer (SWO). "Training Decision Validator" is an internal assignment label, **not** the public brand. Primary audience: individual gym-goers and serious lifters (coaches are secondary, do not dilute the message).

## Scope boundaries and claims
- In scope: frontend, design system, structured content, one subagent, one skill, evidence. **Out of scope:** database, auth, backend, deployment, AI evaluation.
- Never invent testimonials, user counts, adoption metrics, scientific validation, clinical/medical claims, guaranteed outcomes, citations, or support channels/contact links.
- Distinguish sports-science concepts (ACWR, fatigue/recovery, progressive overload) from SWO's own implementation. Do not imply mockups are a live connected product.
- Status is never colour alone: always a text label **and** a distinct icon shape.
- Do not copy competitor branding, wording or assets. `references/external-templates/` are layout lessons only, never site assets.
- Never delete, rename, overwrite or modify anything in `references/`. Do not touch the separate SWO product repo or its Claude data folder.

## Tech stack and commands
React 19, TypeScript, Vite 8, Tailwind CSS v4 (CSS-first), Zod 4, lucide-react, Vitest + React Testing Library, ESLint 9 (+jsx-a11y), Prettier, Sharp. Node 26 runs `scripts/*.ts` natively (no loader); use explicit `.ts` import extensions in anything Node also runs.

```bash
npm run dev               # Vite; pages: /  /dev/showcase.html  /dev/content-demo.html
npm run check             # THE quality gate: typecheck, lint, format, tokens, content, tests, build
npm test                  # Vitest
npm run lint | typecheck | format:check
npm run check:tokens      # WCAG contrast of every token pair (add -- --markdown for a table)
npm run validate:content  # schema + image existence/dimensions; build runs it first
npm run images:optimize -- --src <ref> --out public/images/<group> [--dry-run]
npm run images:verify [-- --report <path>]
npm run capture -- --url <url> --name <stem> [--widths 1280,768,390]   # screenshots + overflow measurement
npm run track:usage       # token/session ledger -> tracking/
```
Caution: port 4173 may be in use by another project on this machine. Use `--port` and `--strictPort`, and confirm the page `<title>` before trusting a screenshot.

## Design tokens (single source of truth)
`src/styles/tokens.css` only. Raw `--palette-*` values feed semantic `--color-*`, `--radius-*`, `--text-*`, etc., which Tailwind reads through `@theme`. Tailwind's default colours, type scale, radii and shadows are **removed on purpose**, so off-system classes do not compile. **No second token file in TypeScript.** Rules and values: `docs/style-guide.md` (every token documented, with WCAG evidence and which v0.1 values were adjusted). Tests fail if the guide and `tokens.css` drift. Components use semantic tokens only: no hex, no palette tokens, only spacing steps 1/2/3/4/6/8/12/16 (lint and tests enforce).

## Content: validate, then render
Copy lives in `src/content/site-content.json`, validated by `src/content/schema.ts` (Zod) through `validateSiteContent()` in `src/content/validate.ts`. Components take the validated `SiteContent` type; **never import the JSON and render it directly.** Invalid content is rejected with the exact field path, never partly rendered. The schema rejects unknown fields, placeholder links, unresolved anchors, and affirmative unsupported claims (heuristic, **not** editorial review). Details: `docs/content-model.md`.

## Reusable components (`src/components/`)
`Button`/`ButtonLink`, `Card`, `SectionContainer`, `SectionHeading`, `StatusBadge`, `FormField`/`TextInput`/`Select`. APIs: `docs/component-reference.md`. Not built yet (Phase D, only if needed): hero, feature section, FAQ, footer, recommendation panel, screenshot component.

## Claude Code tooling
| Tool | Location | Use |
|---|---|---|
| Subagent `design-system-auditor` | `.claude/agents/design-system-auditor.md` | Read-only audit of frontend files or a diff; cites rule IDs from `docs/audit-rules.md` and `file:line`. Invoke: "Use the design-system-auditor subagent to audit `<paths>`". Rule catalogue: `docs/audit-rules.md` |
| Skill `optimize-web-images` | `.claude/skills/optimize-web-images/SKILL.md` | Resize/convert originals from `references/` into `public/images/` with a measured manifest. Invoke: `/optimize-web-images <task>` |

**Both are registered only when a session starts.** A tool created or edited mid-session is not visible to that session. To run one from the authoring session, launch a fresh process, e.g. `claude -p "/optimize-web-images ..." --allowedTools ...`. Permission allowlists need both `Bash(...)` and `PowerShell(...)` forms, and `npm run images:optimize *` (a space before `*`), not `images:*`. Exact commands that worked: `docs/evidence/image-optimization/README.md` and `docs/evidence/subagent-audit/README.md`. The auditor is an LLM and **not deterministic**; treat it as a review layer on top of lint and tests, not a replacement.

## Testing and quality gates
`npm run check` must pass before any commit that changes code. Nothing may be weakened to get green: do not delete or loosen a test, add `eslint-disable` to dodge a real finding, or lower a contrast threshold. Tests cover tokens, component behaviour and accessibility, content schema and rendering, image pipeline, tooling-file structure, and the tracker. Linting bans raw hex colours in `src/` (custom rule `swo/no-raw-colour`) and palette tokens in components.

## Token and session tracking
`npm run track:usage` reads Claude Code's local transcripts for **this project only** and writes `tracking/usage-ledger.json`, `.csv` and `usage-summary.md`. Re-run before quoting any figure; totals grow while a session is active. Essentials:
- Deduplicate by `requestId` (one API response is written as several lines).
- `total = input + output + cache_creation + cache_read`; `thinking_tokens` is a subset of output; nothing is estimated; missing fields are `null`.
- Subagent usage is in `<session>/subagents/agent-*.jsonl`. **Collector 1.0.0 missed it** (found in Phase C, fixed in 1.1.0); any 1.0.0 ledger generated after a subagent ran is under-counted.
- The session count includes child `claude -p` runs launched for demonstrations and helper sessions. See `docs/phase-c-report.md` for the interactive vs child split.
- Known gaps: subscription-level `/usage` is not machine-readable; "running" vs "ended" is inferred (15 min staleness); session end = last request.
Details: `docs/token-tracking.md`. Uncollectable sessions: `tracking/manual-sessions.md`. Never hand-edit the ledger or invent usage.

## Evidence
Index and per-item write-ups: `docs/evidence/README.md`. Phase summary: `docs/phase-c-report.md`. Traceability: `docs/traceability-matrix.md`. Mark nothing "verified" without the command and its real output.

## Current status (end of Phase C)
| Area | Status |
|---|---|
| Token/session tracker | **Done**, extended in Phase C (subagents). Phase B tests preserved |
| Design tokens, style guide, contrast checks | **Done**, tested. Some values still *proposed* (breakpoints, shadows, focus ring, Inter not loaded); see style guide |
| UI primitives, showcase page | **Done**, tested; not yet used by a real page |
| Structured content + validation + demo render | **Done**, tested. Sample copy is draft: `swoImplementation` statements need owner confirmation |
| `design-system-auditor` subagent | **Done and demonstrated** (3/3 planted violations found on a blind fixture; corrected fixture passes). Over-reports once; format not fully reliable |
| `optimize-web-images` skill | **Done and demonstrated** (3 attempts, 2 permission defects found and fixed; 6 outputs, 46/46 checks) |
| Fresh-session handoff test | **Partly done.** An automated fresh `claude -p` process answered 9/9 questions from this file alone (`docs/evidence/handoff/`). The interactive test the assignment describes still needs the user |
| Landing page sections (hero, FAQ, etc.), real-site screenshots | **Not started (Phase D)** |
| Traceability matrix | Mostly **partial**; only the form-control and token-sync rows are fully verified |

**Next recommended step:** the user reviews Phase C, runs the interactive fresh-session handoff test (script in `docs/evidence/handoff/README.md`), then gives a separate Phase D instruction. Open decisions for Phase D: load Inter or not; confirm `swoImplementation` copy; crop/replace screenshots that show a third-party dev URL and a personal profile photo; whether `workout-02` (visible sparkle mark, third-party logos) suits "personal photography".

## Acceptance tests (assignment)
- Design tokens trace to explicit rules in `docs/style-guide.md` and a reference in `docs/reference-catalogue.md`: **demonstrated** for `StatusBadge` (green) in the traceability matrix.
- Structured content validates against a declared schema and renders: **demonstrated** (tests + `dev/content-demo.html`).
- The design-system subagent catches planted violations and cites exact rules: **demonstrated** on a fixture with three planted violations (the brief's literal "real component" wording was met with a realistic fixture file, not a production component).
- A fresh session understands the project from this file: **automated analogue passed 9/9**; the interactive user-run test is still pending.
- A custom skill is applied to a real task with before/after evidence: **demonstrated**.
- Token and session totals are recorded with source and limitations: **recorded**; final figures only settle when the sessions end.

## Working principles
- Small reusable components over page-specific styles; no arbitrary one-off values where a token exists.
- Mobile-first, readable contrast, keyboard accessible. Respect `prefers-reduced-motion`.
- Keep evidence honest: separate completed from planned, and record limits and defects found, not just successes.
