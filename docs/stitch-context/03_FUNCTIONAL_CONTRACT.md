# Functional Contract for Frontend V3

Frontend V3 may redesign presentation and interaction patterns, but it must preserve every contract below by consuming the existing engine rather than reimplementing it.

| Capability | Required interaction and input | Required output and engine dependency | Edge cases that must remain visible |
| --- | --- | --- | --- |
| Product entry and navigation | Begin from the Landing; navigate to input, methodology and architecture; use the top-level navigation where supplied. | Truthful static product context and clear routes into real workflows. | Landing has no analysis session and must not show invented live company results. Navigation remains keyboard accessible and responsive. |
| Canonical financial input | Company name/industry/currency; exactly three chronological unique integer years; all statement fields as strings until transformed. | `transformFormValuesToCanonical()` then `parseFinancialAnalysisInput()`, generating a deterministic internal company id. | Empty/whitespace/non-finite/currency symbol/thousands separator rejected; no empty-to-zero conversion. |
| Guided workflow | Free step navigation, Save and continue, Review, Reset, editable demo load. | Field validation on blur; section validation on continue; global/final validation on Review/analyse. | Blocking errors prevent handoff; warnings/information do not. Every label stays visible. |
| Draft persistence | Browser-local draft save/restore/reset only. | `financial-ratio-analyzer:input-draft:v1`; versioned/safe recovery. | Invalid/partial/corrupt draft is discarded; reset must not recreate a draft via debounce. |
| Analysis handoff | Analyse a valid input. | Versioned `sessionStorage` active-analysis payload and navigation to `/analysis`. | No demo fallback if session absent/corrupt/invalid; revalidate before analysis. |
| Ratio engine | Inspect categories and selected metric/period trend. | Formula registry and `calculatePeriodRatios()`. | Every implemented ratio has label/formula/unit/interpretation; unavailable is never zero. |
| Financial Health Score | Read total, band, dimensions, coverage, history, drivers. | `calculateScoreHistory()` with validated scoring config. | Score unavailable below coverage/dimension requirements; available metrics reweighted; no NaN/Infinity. |
| Deterministic insights | Read strengths, risks, observations and evidence. | `generateDeterministicInsights()` and principal selector. | No AI/confidence claims; raw ids are not user-facing; unavailable evidence does not trigger ordinary rules. |
| Executive dashboard | Read current/prior context, six KPIs, dimensions, insights and visual evidence. | Session recovery -> analysis -> pure dashboard builders. | Distinct loading/empty/corrupt/invalid/analysis failure; no stale dashboard after failure. |
| DuPont | Compare Net Profit Margin x Asset Turnover x Financial Leverage = ROE. | Existing `calculateDuPont()` and Shapley attribution. | Identity and attribution reconciliation are separate; pp contribution formatting; unavailable factors not zero; leverage remains contextual. |
| Scenario Lab | Select Base Case/preset or change all six assumptions. | Full `ScenarioAssumptions` -> `applyScenario()` -> canonical parse -> analysis -> comparison. | Partial/null/non-finite assumptions rejected; Base Case immutable; scenario does not directly edit ratios, scores, insights, or DuPont. |
| Methodology/Engine Map | Access formulas, limits, pipeline ownership/provenance. | Formula/scoring/config/metadata sources. | Must preserve educational disclaimer and distinguish engine from UI. |
| Reporting/accessibility | Print and operate by keyboard. | Native controls/semantic HTML, ECharts summaries, print CSS. | 320px usability; focus, textual status, reduced motion, local table overflow. |

## Structural financial warnings

The input UI must expose non-blocking warnings for cash/accounts receivable/inventory greater than current assets, current assets greater than total assets, and denominator suitability (non-positive revenue, liabilities, assets, equity, working-capital averages, or interest expense). Do not claim an accounting equation has been validated from insufficient data.

## Invariants

- Preserve `FinancialAnalysisInput`, session keys, formulas, scoring config, demo values, and immutable source fixtures.
- Do not introduce backend, authentication, cloud persistence, imports/exports, external APIs, AI, or investment/credit claims.
- Never derive UI values directly inside visual components when a domain/view-model output exists.
