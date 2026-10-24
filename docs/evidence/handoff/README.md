# Evidence: fresh-session handoff

**Outcome: a brand-new Claude Code process, given no background, answered 9 of 9
project questions correctly from `CLAUDE.md` alone. This is an automated
analogue of the handoff test, not the interactive one the assignment describes.**

| Item | Where |
|---|---|
| Questions asked (verbatim, nothing else was supplied) | [questions.txt](questions.txt) |
| Raw result, including session id and usage | [fresh-session.raw.json](fresh-session.raw.json) |

## Method

```bash
claude -p "$(cat docs/evidence/handoff/questions.txt)" --model sonnet \
  --allowedTools "Read" "Glob" "Grep" --output-format json
```

- Fresh process (session `861d0671-aa5d-4ed2-9c8b-f0d27203a5f6`): no access to the
  authoring conversation. `CLAUDE.md` is loaded automatically; `--bare` was
  **not** used because it skips `CLAUDE.md` discovery.
- The prompt says only that the project is unfamiliar and the answers must come from
  the project context or files in the repo. It names no file and gives no facts.
- Read-only tools only. The child made **zero** tool calls (1 turn), so every
  answer came from `CLAUDE.md` itself, not from reading linked documents.
- Contamination check: the project's memory folder is empty and there is no
  user-level `CLAUDE.md`, so nothing else could have supplied the answers.

## Grading

Each answer was checked against the repository, not against my memory of it.

| # | Question topic | Correct? | Checked against |
|---|---|---|---|
| 1 | Work branch and role of `main` | Yes | `dev` exists; `CLAUDE.md` "Read first" |
| 2 | Token source; second TS token file forbidden | Yes | `src/styles/tokens.css` exists; rule in `CLAUDE.md` |
| 3 | Quality-gate command and its contents, in order | Yes | `package.json` `check` script: typecheck, lint, format, tokens, content, tests, build |
| 4 | How content reaches a component; what is forbidden | Yes | `validateSiteContent` exists in `src/content/validate.ts` |
| 5 | Current phase and what is not done | Yes | `CLAUDE.md` status table |
| 6 | Invoking subagent and skill; mid-session caveat | Yes | Both files exist at the stated paths |
| 7 | Collector 1.0.0 defect; honest session counting | Yes | `COLLECTOR_VERSION` is `1.1.0`; defect documented in `docs/token-tracking.md` |
| 8 | Forbidden claims; status presentation | Yes | Matches `CLAUDE.md` "Scope boundaries and claims" |
| 9 | "Should I start Phase D now?" | Yes | Correctly declined and cited the prerequisites |

Question 9 matters most: it is a behaviour test, not a recall test. The child
refused to start Phase D and named the review gate and open decisions.

## Limits (why this is not the full test)

- **I wrote both `CLAUDE.md` and the questions.** The questions target what I
  knew `CLAUDE.md` contains, which favours a pass. An independent reviewer would
  ask different questions.
- **Non-interactive.** It tests comprehension from the file, not a working session in
  the VS Code extension where tools, hooks and memory also load.
- **It answered; it did not work.** Understanding the project is not the same as
  correctly continuing it. A stronger test would have the fresh session fix a real
  small defect and run `npm run check`.
- **Recall was easy for one fact:** question 3's answer is a single line.

## What still needs the user

The assignment's handoff test is the user starting a **fresh interactive session**
and seeing whether it continues the project without re-explanation. A suggested
script, with expected answers hidden from the prompt:

1. Open a new Claude Code session in this folder. Say nothing about the project.
2. Ask: *"What state is this project in, and what should happen next?"*
3. Ask: *"Add a `Tooltip` component"* and watch whether it reads `docs/component-reference.md`,
   uses tokens only, avoids hex colours, and runs `npm run check` before finishing.
4. Record what it did and did not get right.
