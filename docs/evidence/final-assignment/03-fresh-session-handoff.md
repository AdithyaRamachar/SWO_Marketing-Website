# Evidence 3 — Fresh-session handoff

## Summary

A brand-new Claude Code process, given no background context, answered **9 of 9**
project questions correctly from `CLAUDE.md` alone. This is recorded as a verified
automated analogue; the limitations that distinguish it from a full interactive
test are documented below.

---

## Available evidence

| Item | Location |
|---|---|
| Questions (verbatim prompt) | `docs/evidence/handoff/questions.txt` |
| Raw output (JSON) | `docs/evidence/handoff/fresh-session.raw.json` |
| Session ID | `861d0671-aa5d-4ed2-9c8b-f0d27203a5f6` |
| Existing README | `docs/evidence/handoff/README.md` |

The session appears in the tracker with 1 request and 26,349 tokens, ending
`2026-10-24T06:54:22Z` — consistent with a single-turn cold-start.

---

## Invocation

```bash
claude -p "$(cat docs/evidence/handoff/questions.txt)" \
  --model sonnet \
  --allowedTools "Read" "Glob" "Grep" \
  --output-format json
```

Key properties:
- **Fresh process** — no access to any prior conversation.
- `CLAUDE.md` loaded automatically; `--bare` was **not** used (would skip it).
- **Zero tool calls** — every answer came from `CLAUDE.md` in one turn.
- **Read-only tools only** — no file modifications possible.
- No memory folder entries, no user-level `CLAUDE.md` could have contaminated it.

---

## Test questions and graded responses

| # | Question topic | Response correct? | Verification source |
|---|---|---|---|
| 1 | Work branch and role of `main` | **Yes** — answered `dev` / reviewed baseline, no merge without ask | `CLAUDE.md` "Read first" + `git branch` |
| 2 | Token source; second TypeScript file forbidden | **Yes** — `src/styles/tokens.css`, explicitly no second TS file | `src/styles/tokens.css` exists; `CLAUDE.md` rule |
| 3 | Quality-gate command and contents | **Yes** — `npm run check`: typecheck, lint, format, tokens, content, tests, build | `package.json` `check` script |
| 4 | How content reaches a component; what is forbidden | **Yes** — `validateSiteContent()` boundary; direct JSON import forbidden | `src/content/validate.ts`, `src/main.tsx` |
| 5 | Current phase and what is not done | **Yes** — end of Phase C; landing page, real screenshots, interactive handoff not done | `CLAUDE.md` status table |
| 6 | Subagent and skill invocation; mid-session caveat | **Yes** — paths correct; caveat (registered only at session start) correct | `.claude/agents/`, `.claude/skills/` |
| 7 | Collector 1.0.0 defect; honest session counting | **Yes** — subagent files missed in 1.0.0; re-run tracker; never hand-edit | `docs/token-tracking.md`, `COLLECTOR_VERSION 1.1.0` |
| 8 | Forbidden claims; status colour rule | **Yes** — 4 forbidden items; text label + distinct icon shape required | `CLAUDE.md` "Scope boundaries" |
| 9 | Should Phase D start now? | **Yes** — correctly declined; cited prerequisites and open decisions | `CLAUDE.md` "Next recommended step" |

Question 9 is a **behaviour test, not a recall test.** The fresh session refused to
start Phase D and named the specific prerequisites, which is the correct response.

---

## Actual response (abbreviated)

The full response is in `docs/evidence/handoff/fresh-session.raw.json`. Key extracts:

> **4. Content pipeline to components:** Copy lives in `src/content/site-content.json`,
> must be validated by `validateSiteContent()` from `src/content/validate.ts`, and
> components receive the typed `SiteContent` object. Importing the JSON directly
> and rendering it is forbidden; partially-rendered invalid content is also forbidden.

> **9. Should Phase D start now?** Not yet, per CLAUDE.md. Three prerequisites are
> explicitly listed first: the user reviews Phase C, runs the fresh-session handoff
> test (which requires the user to start a new session), and then gives a separate
> Phase D instruction.

---

## What the test proves

- `CLAUDE.md` contains enough structured information for a cold-start session to
  understand the project's architecture, tooling, constraints, and current state.
- The fresh session can correctly reason about process (what to do and what NOT to
  do) from the file, not just recall isolated facts.
- The token source, validation boundary, subagent path, skill path, and forbidden-
  claim rules are all represented correctly.

---

## Honest limitations

1. **The author wrote both `CLAUDE.md` and the questions.** The questions were
   designed to probe what `CLAUDE.md` contains, which gives a structural advantage.
   An independent reviewer asking open-ended questions might surface gaps.

2. **Non-interactive.** The test was a single `--print` invocation. An interactive
   session in VS Code also loads memory, hooks, and tool inventory from the
   environment. These were not tested.

3. **The session answered; it did not work.** Understanding the project is not the
   same as correctly continuing it. A stronger demonstration would be:
   - Ask the fresh session to add a new component following the design system.
   - Run `npm run check` and confirm it passes.
   - The current evidence does not include this.

4. **Zero tool calls** means the answers came entirely from `CLAUDE.md`, not from
   reading linked documents. This is good evidence that `CLAUDE.md` is self-
   contained — but it also means the session did not verify any linked file.

---

## Reproduction command

```bash
# Run from the project root (e:\Projects\Airtribe_PM\SWO_Project)
claude -p "$(cat docs/evidence/handoff/questions.txt)" \
  --model sonnet \
  --allowedTools "Read" "Glob" "Grep" \
  --output-format json
```

The output will differ in session ID and response wording (the model is not
deterministic), but the factual content should remain correct as long as `CLAUDE.md`
is not substantially changed.

---

## What still needs the user

The interactive form of this test requires you to:

1. Open a **new** Claude Code session in this folder. Say nothing about the project.
2. Ask: *"What state is this project in, and what should happen next?"*
3. Ask: *"Add a `Tooltip` component"* and observe whether the session reads
   `docs/component-reference.md`, uses design tokens, avoids hex colours, and runs
   `npm run check` before reporting done.
4. Record what it got right and wrong.

This cannot be automated because it requires a genuine interactive session where
context builds incrementally, as it would in a real handoff.
