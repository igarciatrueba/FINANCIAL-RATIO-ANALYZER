# V2.5 Premium Visual Evolution

This document applies only to the V2 premium frontend on `design-experiment-premium-front`. It does not replace the baseline design system or change product functionality.

## Intent

V2.5 evolves the premium frontend into a high-end financial intelligence workspace. The visual language remains dark, precise and blue-led, but avoids a uniform grid of rounded SaaS cards. Financial values and deterministic evidence remain the primary visual material.

## Ambient depth

The reusable ambient system uses two or three extremely diffuse blue/navy fields derived from the existing palette. Fields move only through opacity and transform over 24–31 second cycles. They belong behind landing, analytical introductions, the executive focal row, Scenario Lab and Engine Map. They become quiet or absent behind dense forms and tables.

Ambient effects are decorative only: they must never communicate a financial state. The effect is disabled when `prefers-reduced-motion` is enabled.

## Surface hierarchy

There are three deliberate levels.

1. **Workspace**: the near-black background and sparse grid are the stable level for dense analysis.
2. **Analytical surfaces**: open sections, top/bottom rules and low-contrast directional fills group related evidence without turning every block into a card.
3. **Focused surfaces**: crystal panels and controls identify current context, a selected workspace, a primary score, or a selected technical stage.

`premium-panel` remains for genuinely framed content. `analytical-surface`, `open-section`, `data-rail`, `control-plane`, and `result-plane` provide alternate composition rhythms.

## Crystal rules

Crystal is a selective control treatment: a semi-transparent dark/blue surface, restrained blur, internal top highlight, translucent border and modest edge light. It is appropriate for primary actions, active navigation, selected analytical workspaces, command bars, the Financial Health focal panel and selected Engine Map detail.

Crystal must not be used for every card, detailed table row, financial input field, long-form disclosure, or all dashboard modules. Dense financial reading surfaces remain opaque enough for contrast and scanability.

## Motion

- Feedback and press states: 150–220ms.
- Section reveal: 440–520ms, grouped rather than per-cell.
- DuPont nodes and Engine Map active paths: one short selection response only.
- Ambient movement: 24–31 seconds, opacity/transform only.

There is no bouncing, perpetual path light, value-counting animation, or motion used as the sole status signal. The global reduced-motion rule suppresses these effects.

## Data presentation

Inter remains the primary font. Monospace/tabular numerals remain mandatory for financial values. KPI content is presented as a shared instrument rail with separators rather than six detached cards. Charts use precise axes, subdued grids, selected-series emphasis and crystal tooltips; no data or chart semantics are changed.

## Accessibility and performance

All controls preserve native keyboard operation, visible focus, semantic labels and existing safe states. Crystal surfaces retain contrast. Blur is limited to selected focal/control surfaces; ambient fields avoid continuously animating filters and use only transform/opacity so scrolling remains inexpensive.
