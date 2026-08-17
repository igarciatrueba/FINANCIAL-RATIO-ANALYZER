# Screen Inventory

The main worktree (`main`) is the baseline application. The premium worktree is documented separately in `09_LEGACY_FRONTENDS.md` and is not mounted by baseline routes.

| Route | Purpose and user objective | Main UI/data dependency | Important states and responsive behaviour |
| --- | --- | --- | --- |
| `/` | Understand product and begin analysis. | Static landing, CTAs to input/analysis, design primitives. | Marketing-style baseline page; responsive hero/grid; no session requirement. |
| `/input` | Build or load the three-period canonical input. | `FinancialInputWorkflow`, React Hook Form, demo fixtures, parser/transform/validation/persistence. | Six freely navigable steps, blur/section/review validation, local draft restore/reset, 3-column desktop and stacked mobile inputs. |
| `/analysis` | Executive understanding of current condition. | Session recovery -> `analyseFinancialStatements()` -> dashboard view model -> charts/components. | Loading, absent/corrupt/invalid/analysis-failure states; score can be unavailable; desktop analytical grid reflows for mobile. |
| `/analysis/ratios` | Inspect all registered ratios and select one trend. | Same active-analysis session; ratio-analysis view model; formula registry. | Category and metric selectors, local horizontal table scroll, unavailable values/reasons. |
| `/analysis/dupont` | Explain current ROE and period-over-period driver attribution. | Same active session; DuPont view model and Shapley attribution. | Identity, factor comparison, attribution chart, indexed trends, disclosure; distinct safe session states. |
| `/scenario` | Test latest-period statement assumptions against Base Case. | Same active session; scenario contract -> `applyScenario()` -> canonical reparse -> analysis -> comparison view model. | Base Case, transformed success, validation/canonical/analysis errors; keyboard-editable controls and presets. |
| `/engine-map` | Explain architecture and provenance, not a company analysis. | Static `buildEngineMapViewModel()` from real metadata/registries. | Selectable stage inspector, technical disclosure, scenario-reuse map; no session required. |
| `/methodology` | Read formulas, scoring methodology, limitations, and documentation map. | Methodology view model plus documentation-derived copy. | Disclosure/detail-first reference content; no session required. |
| `not-found`, `error` | Safe application fallbacks. | Next.js route/error boundary. | Clear recovery route; no raw stack trace. |

## Dashboard content hierarchy

The dashboard presents command/context, Financial Health Score/classification/change/coverage, deterministic diagnosis, six prioritised KPIs, five dimensions, radar and health history, selectable ratio trend, profitability bridge, working-capital cycle, score contribution, principal insights, and a detailed ratio table. Charts must consume existing view models only.

## Shared page conventions

`AppShell` provides top navigation and a skip link on analysis-oriented routes. `/input` has a dedicated workflow header. `PrintReportButton`, native semantic headings, focus-visible treatment, local table scrolling, and reduced-motion CSS are shared behavioural expectations.
