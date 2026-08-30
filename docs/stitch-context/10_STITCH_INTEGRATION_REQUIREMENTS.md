# Stitch Integration Requirements

## Visual freedom

Stitch may radically improve layout, hierarchy, navigation presentation, transitions, chart presentation, controls, storytelling, responsive composition and analytical exploration. It may propose new visual tokens and reusable visual components for V3. It can make the experience more editorial, terminal-like, calm, dense, or exploratory as long as it remains a serious financial product.

## Functional constraints

Stitch must preserve all three-period canonical inputs, field labels, validation timing and state semantics; registered ratios/formula metadata/units/current-prior history/unavailable reasons; score anchors/weights/bands/coverage/drivers; deterministic insight evidence/order/no-AI constraints; DuPont calculations/reconciliation/Shapley pp values/contextual leverage; scenario controls/presets/limits/immutability; session/draft contracts and safe states; factual charts and accessible summaries; print, keyboard, focus, reduced-motion and 320px support.

## Explicit prohibitions

Do not replace the engine with placeholder values, pseudo-financial calculations, editable chart data, an AI narrative, a score computed in components, or a static mockup. Do not hide unavailable values as 0. Do not introduce unsupported forecast/credit/audit/investment claims. Do not mutate demo fixtures or existing session data.

## Implementation constraint

Stitch output is design input, not production code. Codex will translate it into independently scoped V3 components that call the existing TypeScript engine. A designer must label questions instead of guessing financial meaning.

## Acceptance checks for V3

1. Map every V3 screen/control to `feature-matrix.json`.
2. Run domain/integration tests unchanged; add parity tests for new UI.
3. Test NovaTech, Atlas, missing/corrupt/invalid sessions, unavailable metrics and invalid scenarios.
4. Verify V1/V2 routes still render independently.
5. Review visual changes separately from methodology.
