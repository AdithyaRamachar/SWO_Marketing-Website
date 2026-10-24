# Implementation Brief for Claude Code

## Outcome
Create one polished, responsive landing page for Smart Workout Optimizer (SWO), in a standalone local project.

## Required sections
1. Hero with product-first visual, headline, short supporting copy, and primary CTA.
2. Training guesswork/problem section.
3. How it works: sleep quality + fatigue/stiffness + workout history → analysis → exercise-level guidance.
4. RAG explanation with accessible semantic status badges.
5. Product walkthrough using the supplied dashboard, exercise card, caution explanation, progression message, and session summary screenshots.
6. Science-engine explanation: ACWR, fatigue/recovery curves, progressive overload logic.
7. FAQ and final CTA.

## Visual direction
Use the style guide and traceability matrix. Use the supplied product screenshots as authentic UI. Use personal gym photos selectively. External template screenshots are design references only; do not display them as SWO product assets.

## Content structure
Store repeated feature/FAQ/decision-state content in a structured local data file and validate it against an explicit schema or equivalent rules. Render the validated data on the actual page. Keep content separate from presentation.

## Reusable UI candidates
- `Button`
- `SectionHeading`
- `StatusBadge`
- `RecommendationPanel`
- `ProductScreenshot`
- `FeatureSection`
- `MetricCard`
- `FAQItem`
- `SiteHeader`
- `SiteFooter`

Names are suggestions; inspect the chosen stack before committing to architecture.

## Non-functional requirements
- Responsive at mobile, tablet, and desktop widths.
- Accessible heading order, alt text, keyboard focus, and status labels.
- No backend, database, deployment, or AI evaluation.
- No fake testimonials, fabricated performance metrics, or unsupported scientific/medical claims.
- Keep dependencies minimal and explain any new dependency.
- Do not overwrite or access the user's existing product repository.

## Required evidence later
- Rendered desktop and mobile page screenshots.
- Structured content validation output.
- Design-token traceability proof for at least one component.
- Compliance subagent output after exactly three planted violations.
- Fresh-session handoff evidence.
- Custom-skill before/after result.
- Token/session metrics collected by the user's chosen Claude Code mechanism.
