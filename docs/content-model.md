# Structured content model

The marketing page renders from structured content, not from copy typed into JSX.
This document describes the model, the validation rules and the boundary.

| Piece | Location |
|---|---|
| Schema and rules (Zod) | [`src/content/schema.ts`](../src/content/schema.ts) |
| Validation boundary | [`src/content/validate.ts`](../src/content/validate.ts) |
| Sample dataset | [`src/content/site-content.json`](../src/content/site-content.json) |
| Command-line check | `npm run validate:content` ([`scripts/validate-content.ts`](../scripts/validate-content.ts)) |
| Rendering demonstration | [`src/dev/ContentDemo.tsx`](../src/dev/ContentDemo.tsx), page `dev/content-demo.html` |
| Tests | `tests/content-schema.test.ts`, `tests/content-render.test.tsx` |

## Why structured content

Headings, paragraphs, calls to action, FAQ and feature copy live in data. That
keeps wording reviewable in one place, lets validation reject unsupported claims
before they reach a page, and keeps presentation components free of copy.

## The boundary

```
raw JSON  ->  validateSiteContent(input: unknown)  ->  { ok: true, data: SiteContent }
                                                     | { ok: false, issues: ContentIssue[] }
```

- Raw content enters as `unknown`. Only the `ok: true` branch yields a
  `SiteContent`, so a component typed to take `SiteContent` cannot receive
  unvalidated data through normal code.
- Invalid content is **never partially rendered, patched or silently repaired**.
  There is no `data` on the failure branch.
- Each issue carries a dotted `path` (`faq[2].answer`) and a message that says
  what to change.
- `npm run build` runs `validate:content` first, so a build with invalid content
  fails.

`validate:content` additionally checks what a schema cannot: every referenced
image exists under `public/` and its declared `width`/`height` equal the real
file's.

## Sections

| Key | Contents |
|---|---|
| `meta` | Page title and description |
| `hero` | Headline, supporting copy, primary and optional secondary CTA, preview image |
| `problem` | The training-guesswork framing and up to five points |
| `howItWorks` | 3 to 5 steps, each tagged `input`, `analysis` or `guidance` |
| `statuses` | Exactly three: `green`, `amber`, `red`, each with label, meaning, example rationale and suggested action |
| `features` | 1 to 6 sections, each with a product image and `imageSide` |
| `methodology` | Frameworks (concept **and** SWO implementation), an evidence status, and a disclaimer |
| `faq` | 3 to 10 question/answer pairs |
| `footer` | Link groups and a legal note |

## Rules enforced

| Rule | Behaviour |
|---|---|
| Required fields | A missing field is reported as `is required` at its exact path |
| Types | A wrong type reports what was received: `must be text (received a number)` |
| **Unknown fields rejected** | Objects are strict. A misspelt `headlne` is an error, not silently dropped |
| Lengths | Every text field has a minimum and maximum, stated in the message |
| Links | Only `#section`, `/path` or `https://…`. Rejected: `#`, empty, `javascript:`, `mailto:`/`tel:`, plain `http://`, protocol-relative, whitespace, and placeholder hosts such as `example.com` or `localhost` |
| Anchors | An in-page link must target a real section id (`#hero`, `#problem`, `#how-it-works`, `#status`, `#product`, `#science`, `#faq`) |
| CTAs | The secondary CTA may not duplicate the primary's destination |
| Images | `src` must be an optimised path under `/images/`. Alt text is at least 20 characters and must not start with "image of" or "screenshot of". `width`/`height` are required whole numbers |
| Status triple | Green, Amber and Red each exactly once, each with rationale and action. This builds in "explain the status, don't just colour it" |
| Framework vs implementation | Every framework needs both `concept` (the published idea) and `swoImplementation` (what SWO does). They cannot be blurred |
| Evidence status | `evidenceStatus: "sourced"` requires at least one https source. `framework-description-only` makes no evidential claim and is rendered as such |
| Flow | `howItWorks` must include an input, an analysis and a guidance step |
| Uniqueness | Ids within a list are unique; FAQ questions are unique |
| **Claim guard** | Rejects affirmative unsupported claims (below) |

### The claim guard, and its limits

Text fields are scanned for phrases that assert what SWO cannot substantiate:
`guarantee(d)`, `clinically proven/validated`, `scientifically proven/validated`,
`proven`, predicting/preventing/reducing injury, `cures/treats/diagnoses`,
adoption figures (`10,000 lifters`), `trusted by`/`endorsed by`/`featured in`/
`testimonial`, and professional endorsements (`coach-recommended`).

A match is **ignored when a negation appears within 40 characters before it**, so a
disclaimer such as "does not diagnose, treat or prevent injury" and "has not been
clinically validated" is allowed.

This is a pattern-based safety net, not editorial review:

- It **cannot tell whether a sentence is true.** A false claim in plain wording
  passes.
- It is English-only and misses paraphrase ("works every time" is not caught).
- The negation window can wrongly excuse a claim placed after an unrelated "not".

**Copy must still be reviewed by a person.** In particular, every
`swoImplementation` statement in the sample dataset is **draft copy that the
project owner must confirm** describes how SWO really works; nothing in the
repository establishes the algorithm's details.

## Sample dataset notes

`site-content.json` is realistic, not final. It deliberately contains:

- no testimonials, user counts, pricing, download links, support email or other
  contact channel (none is confirmed);
- no external citations (`evidenceStatus` is `framework-description-only` for all
  three frameworks) because none has been verified;
- in-page anchor CTAs only, since no destination outside the page is confirmed.

## Adding content

1. Edit `src/content/site-content.json`.
2. Run `npm run validate:content`. Fix every reported path.
3. If you add an image, generate it with the `optimize-web-images` skill and copy
   its `width`/`height` from `public/images/manifest.json`.
