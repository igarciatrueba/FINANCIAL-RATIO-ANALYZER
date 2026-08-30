# Visual Reference Index

These are reference captures of the existing frontends, not V3 designs. They preserve the current visual baseline while Stitch exploration is isolated.

| Reference | Iteration | Capture | What it establishes |
| --- | --- | --- | --- |
| [V1 landing, desktop](assets/v1-landing-1440.png) | V1 baseline | 1440px desktop | Baseline dark-first landing hierarchy, navigation treatment, introductory engine path and restrained blue semantic accent. |
| [V1 input, desktop](assets/v1-input-1440.png) | V1 baseline | 1440px desktop | Guided financial-input composition, visible labels, workflow structure and demo entry points. |
| [V1 input, mobile](assets/v1-input-390.png) | V1 baseline | 390px mobile | Compact workflow state, persistent labels and small-screen information ordering. |
| [V1 Engine Map, desktop](assets/v1-engine-map-1440.png) | V1 baseline | 1440px desktop | Product-architecture explainer as a standalone top-level route. |
| [V2 premium landing, desktop](assets/v2-premium-landing-1440.png) | V2 premium experiment | 1440px desktop | Editorial premium direction: high-contrast typography, focused analytical-preview composition, cobalt accent and a more expressive product narrative. |
| [V2 executive dashboard](assets/v2-premium-dashboard.png) | V2 premium experiment | Desktop | Data-connected executive context, health-score/diagnosis hierarchy and action bar. |
| [V2 ratio analysis](assets/v2-premium-ratio-analysis.png) | V2 premium experiment | Desktop | Registered-ratio category/metric interaction, contextual navigation and analytical-table/trend presentation. |
| [V2 DuPont analysis](assets/v2-premium-dupont-analysis.png) | V2 premium experiment | Desktop | ROE overview, contextual explanation and the connected three-factor identity. |
| [V2 Scenario Lab](assets/v2-premium-scenario-lab.png) | V2 premium experiment | Desktop | Preset selection, complete scenario assumptions, explicit operating-sensitivity limitation and Base Case reset. |
| [V2 Engine Map](assets/v2-premium-engine-map.png) | V2 premium experiment | Desktop | Interactive pipeline-stage explainer and technical/provenance hierarchy. |

## Capture notes

- V1 was captured from the main worktree at `http://localhost:3004` to avoid port conflicts.
- V2 was captured from the separate premium worktree at `http://localhost:3003`.
- Data-dependent analysis surfaces require a valid session handoff and are specified in the screen inventory, functional contract, view-model architecture and tests. They must not be replaced with made-up static visual data for V3.
- The V1 landing contains historical phased-delivery wording. It is retained as existing copy evidence, not as an authoritative statement of the current functional scope. The functional route inventory and source code are authoritative.
- V2 `Financial Input` and `Methodology` remain represented by their full functional briefs and V1 input reference. Their premium layouts should be treated as design exploration targets, not a reason to guess or replace their established behaviours.
