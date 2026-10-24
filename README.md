# SWO Website — Project Brief

## Purpose
Build a polished, responsive, public-facing marketing landing page for **Smart Workout Optimizer (SWO)**. This is a standalone local frontend project and must not be linked to or modify the existing product repository.

## Product
SWO is a mobile-first, wearable-free training decision-support app. It uses three daily inputs—sleep quality, fatigue/stiffness, and workout performance history—alongside training frameworks to generate exercise-level Green / Amber / Red guidance.

- **Green — Optimal zone:** exercise is within the app's defined training range.
- **Amber — Caution zone:** consider adjusting intensity or volume.
- **Red — High-risk flag:** the app recommends rest or active recovery according to its rules.

Explain recommendations in context. Do not present colour alone as the explanation.

## Audience
Primary: individual gym-goers and serious lifters.
Secondary: coaches and trainers (do not dilute the primary message).

## Scope
- One responsive landing page.
- Marketing copy and product-interface previews using the supplied screenshots.
- Design system, structured content, and reusable frontend components.
- A design-system compliance subagent.
- A custom skill that performs one repeatable frontend task.
- `CLAUDE.md` and evidence demonstrating the tooling works.

Out of scope: database integration, deployment, and AI evaluation.

## Visual direction
Product-first hero: light/neutral canvas, strong ink-navy typography, teal accent, prominent product UI preview, and clear CTA. Use cinematic gym photography in supporting sections, not as the dominant hero. Use the uploaded SWO app screenshots as the source of truth for product UI. External examples are references for layout and storytelling only; do not copy their branding or proprietary assets into the site.

## Proposed page structure
1. Hero: value proposition, primary CTA, product preview.
2. The training-guesswork problem.
3. How SWO works: inputs → analysis → exercise-level guidance.
4. Green / Amber / Red decision system.
5. Inside the app: dashboard, exercise recommendation, caution explanation, session recap.
6. Science engine: ACWR, fatigue/recovery concepts, progressive overload logic.
7. FAQ and final CTA.

## Claim discipline
Describe the science frameworks and SWO's implementation separately. Do not claim injury prediction, clinical validation, guaranteed performance, or proven outcomes without evidence. Do not invent testimonials, user counts, endorsements, or support channels.

## Reference folders
- `references/external-templates/`: nine supplied template screenshots.
- `references/product-screenshots/`: six supplied SWO app screenshots.
- `references/photography/`: four supplied personal gym photographs.

See `docs/` for the formal design brief, proposed tokens, and traceability matrix.
