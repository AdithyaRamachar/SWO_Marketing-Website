# SWO Website — Claude Code Project Context

## Mission
Build a responsive, product-first public marketing landing page for Smart Workout Optimizer (SWO) in this standalone repository.

## Before coding
1. Read `README.md` and every relevant file in `docs/`.
2. Inspect the supplied images in `references/`; do not substitute unrelated/generated screenshots for authentic SWO UI.
3. Check the current project files and toolchain before choosing or changing the stack.
4. Keep work limited to the frontend/design system, structured content, subagent creation, and custom skill creation.
5. Token tracking will be initiated by the user inside Claude Code. Do not claim token usage is being captured unless a verified mechanism is configured.

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
- Keep a clear record of decisions, validation results, and evidence. The user is responsible for initiating and verifying token tracking.

## Working principles
- Prefer small, reusable components over duplicated page-specific styles.
- Avoid arbitrary one-off values where a documented token exists.
- Do not claim tests passed unless they were actually run and results observed.
- Ask before expanding scope or introducing dependencies that materially change the project.
