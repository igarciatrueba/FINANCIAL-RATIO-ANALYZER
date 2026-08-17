# Financial Ratio Analyzer — Stitch Master Context

Design a **new Frontend V3 / Stitch** for Financial Ratio Analyzer. It must be an independently scoped new experience, not a static mockup and not a replacement for the protected existing frontends or financial engine.

## Product

This educational financial intelligence application accepts exactly three annual periods of simplified statements. It produces registered ratios, transparent Financial Health Score/coverage, deterministic strengths and risks, DuPont ROE analysis, latest-period statement scenarios, methodology and an Engine Map. It is not accounting, audit, credit-rating, investment or forecasting software.

## Engine contract

The flow is form strings -> explicit parsing -> `parseFinancialAnalysisInput()` -> `FinancialAnalysisInput` -> `analyseFinancialStatements()` -> typed view models -> UI. Reuse the existing TypeScript domain engine and existing feature view models. Do not calculate finance, scores, insights or scenario outputs in visual components. Never turn unavailable into zero.

## Required V3 surface

Preserve Landing, Input, Dashboard, Ratio Analysis, DuPont, Scenario Lab, Engine Map, Methodology, print/accessibility and all safe states. Preserve context, current/prior comparison, history, formula metadata, coverage/drivers, insight evidence, DuPont reconciliation/attribution, scenario limitations and keyboard/reduced-motion/320px support. `03_FUNCTIONAL_CONTRACT.md` and `feature-matrix.json` are mandatory parity checklists.

## Complete screen map

| Screen | User goal | Required interactions and information | Data/safe-state boundary |
| --- | --- | --- | --- |
| Landing (`/`) | Understand the product and begin. | Truthful product promise; clear input CTA; methodology and engine discovery. | No session. Do not present static decorative financial values as live company analysis. |
| Financial Input (`/input`) | Create a valid three-year dataset. | Editable fictional demo load; six freely navigable steps; permanent labels; Review; Reset; Analyse. Desktop uses annual columns and mobile stacks fields by concept. | One string-valued form; field/section/global/final validation; versioned local draft; warnings remain non-blocking. |
| Executive Dashboard (`/analysis`) | Understand condition in about 30 seconds. | Company/current-vs-prior/currency/coverage context; health score; diagnosis; six KPIs; dimensions; trends; profitability bridge; working-capital; score contribution; insights; ratio table; print/edit/methodology actions. | Recover, revalidate, analyse, then build view model. Loading, absent, corrupt, canonical-invalid, analysis-failure and score-unavailable states are distinct. |
| Ratio Analysis (`/analysis/ratios`) | Inspect every registered ratio. | Category and ratio selector; three-period trend; current/prior/change; formula, unit, interpretation and grouped detailed table. | Registry metadata only; unavailable retains its reason and is never displayed as zero. |
| DuPont (`/analysis/dupont`) | Explain reported ROE. | Connected Margin x Turnover x Leverage identity; factor comparison; exact Shapley contribution in percentage points; three-year indexed trend; methodology disclosure. | Identity reconciliation is separate from attribution reconciliation; no hidden residual; leverage is contextual, never automatically favourable. |
| Scenario Lab (`/scenario`) | Compare a latest-period statement sensitivity to the immutable Base Case. | Select preset; edit six complete assumptions; compare score/dimensions/metrics/insights/DuPont; reset Base Case; disclose limitations. | Full typed assumptions -> scenario transform -> canonical parse -> same analysis engine. It is not a forecast and cannot directly edit ratios or scores. |
| Engine Map (`/engine-map`) | Understand the actual analytical architecture. | Select a pipeline stage; inspect ownership/provenance/consumers; disclose scenario reuse and technical detail. | No company session and no fictional architecture nodes. |
| Methodology (`/methodology`) | Inspect formulas, scoring and limitations. | Readable formula, score, coverage, scenario and educational-disclaimer disclosures. | Static/reference content, but its wording must remain aligned with the canonical engine. |
| Application safe states | Recover safely anywhere a session or calculation is required. | Clear status, non-technical explanation and a route back to input or dashboard as appropriate. | Never retain stale/partial analysis; never expose raw errors, `NaN`, `Infinity`, or a fabricated zero. |

## Module relationships

The Input owns canonical dataset creation. Dashboard, Ratio Analysis, DuPont and Scenario Lab consume the same revalidated active-analysis session; Scenario Lab additionally produces a temporary transformed canonical candidate and reruns that same engine. Formula Registry supplies display labels, formulas, units, descriptions and availability metadata to presentation. Methodology and Engine Map explain those contracts. No visual screen owns financial rules.

## Financial facts to respect

- Canonical periods are old-to-new; final period is current; oldest average balance uses current closing fallback.
- All input fields are finite numbers after explicit parsing; years are unique chronological integers; currencies are EUR/USD/GBP.
- Scores use existing anchors/weights and coverage reweighting, with educational disclaimer.
- Insights are fixed deterministic rules, never AI.
- `ROE = Net Profit Margin × Asset Turnover × Financial Leverage`; Shapley values are percentage points.
- Scenarios transform latest-period statements from complete assumptions, then canonical-validate and rerun the same engine; they are not forecasts/full statement models.

## Typography and identity

**PRESERVE BY DEFAULT:** Inter (`Inter, system-ui, sans-serif`) as primary font and JetBrains Mono/fallback monospace with tabular numbers. Maintain dark professional financial-tool character, semantic text/icon states, focus visibility, reduced motion and small-screen support. Visual hierarchy, components, charts, navigation composition and transitions may be reinvented.

The exact current type scale is display 48px, H1 36px, H2 30px, H3 24px, H4 20px, body-large 18px, body 16px, small 14px and caption 12px. Preserve it by default unless an explicitly approved V3 type-system decision supersedes it. Financial values use tabular numerals.

## Protected iterations

V1 is `main` in `/Users/igarciatrueba/Developer/FINANCIAL-RATIO-ANALYZER`. V2 is the premium worktree on `design-experiment-premium-front`. V3 must coexist with both until explicit migration/deletion approval. Use a separate route/directory/flag and reversible rollout.

## Read next

Read `01_PRODUCT_CONTEXT.md`, `02_SCREEN_INVENTORY.md`, `03_FUNCTIONAL_CONTRACT.md`, `04_FINANCIAL_ENGINE_MAP.md`, `05_DATA_FLOW_AND_STATE.md`, `06_DESIGN_SYSTEM_CURRENT.md`, `08_FRONTEND_ARCHITECTURE.md`, `10_STITCH_INTEGRATION_REQUIREMENTS.md`, and `11_STITCH_SCREEN_BRIEFS.md`. Do not guess financial behaviour: raise questions for Codex.

## Non-negotiable implementation guardrails

- Connect every shown company value to the existing canonical input, analysis result or typed feature view model. Decorative mock financial data is prohibited on analysis screens.
- Do not change formulas, score thresholds/weights, scenario transformations, demo values, insight rules, session/draft keys or browser-local storage behaviour as part of redesign.
- Do not add AI, backend, authentication, external financial APIs, CSV/Excel imports, exports, forecasting claims, credit claims or investment recommendations.
- Do not globally redesign V1/V2. V3 must be isolated, reversible and tested for functional parity before any migration decision.
