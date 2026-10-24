# Design-System Traceability Matrix

This matrix defines the required chain: reference → documented rule → token → component → verification. Rows are proposed until implemented and tested.

| ID | Reference | Style-guide rule | Token(s) | Component | Verification |
|---|---|---|---|---|---|
| TR-01 | `REF-04` marketing hero | Product-first hero with strong headline and one dominant CTA | `font.size.hero`, `color.text.primary`, `color.brand.primary`, `content.max-width` | `HeroSection`, `Button` | Inspect rendered desktop/mobile hero; check token usage |
| TR-02 | `REF-01`, `APP-02` | Product preview must preserve UI and pair status with rationale | `radius.card`, `color.border.default`, `color.status.green.*` | `ExercisePreview`, `StatusBadge` | Screenshot comparison; verify status label and icon |
| TR-03 | `REF-02`, `APP-01` | Alternate feature sections; explain dashboard metrics in context | `space.8`, `space.16`, `color.text.secondary` | `FeatureSection`, `DashboardPreview` | Inspect alternating layout and mobile stacking |
| TR-04 | `APP-03`, `APP-05` | Caution state includes status, rationale, and action; not colour alone | `color.status.amber.*`, `space.4`, `radius.card` | `RecommendationPanel` | Confirm text/icon/action present and contrast checked |
| TR-05 | `APP-06` | Session summary presents outcome and statuses clearly | `color.status.green.*`, `color.status.amber.*`, `color.status.red.*` | `SessionSummaryPreview` | Verify each status includes readable label |
| TR-06 | `REF-05`, `REF-06` | Benefits are distinct and supported by relevant product visuals | `font.size.h3`, `space.6`, `radius.card` | `ValueFeatureCard` | Content schema validates and each item renders correctly |
| TR-07 | `REF-07` | Scientific claims distinguish framework, implementation, and evidence | `font.size.body`, `line-height.body`, `color.text.secondary` | `ScienceSection`, `SourceLink` | Editorial review; verify cited sources exist |
| TR-08 | `REF-08`, PHOTO assets | Photography supports the message and maintains text contrast | `content.max-width`, `radius.card` | `TrainingPhotoSection` | Inspect crop at mobile/desktop and text contrast |
| TR-09 | `REF-03` | Help links have clear labels and real destinations | `font.size.body`, `space.4` | `FAQSection`, `FooterLink` | Check destinations; no placeholder links presented as real |

## Example end-to-end proof (to complete after implementation)
1. Select `StatusBadge`.
2. Identify the semantic token it consumes, e.g. `color.status.green.bg`.
3. Locate the matching token definition in the implemented token file.
4. Locate the documented rule in `docs/style-guide.md`.
5. Identify the supporting reference in `docs/reference-catalogue.md`.
6. Verify the rendered component uses that token and includes text/icon, not colour alone.

Do not mark any traceability row as passed until the component exists and has been inspected.
