# Scenario Lab Methodology

The Scenario Lab is an educational what-if workspace. It transforms the latest reporting period in a cloned Scenario Case, validates the transformed statements with the canonical parser, and then runs the standard analysis pipeline.

It is not a forecast, probability model, credit recommendation, investment recommendation, audit opinion or substitute for professional judgement.

## ScenarioAssumptions

The Phase 8 Scenario Lab uses this assumption contract:

```ts
interface ScenarioAssumptions {
  revenueGrowthPercent: number;
  ebitMarginPercent: number | null;
  totalDebtChangePercent: number;
  currentAssetsChangePercent: number;
  inventoryChangePercent: number;
  interestExpenseChangePercent: number;
}
```

Percentage-change controls use whole percentages. For example, `15` means `+15%` and `-20` means `-20%`.

`ebitMarginPercent` is a target margin, not a change. For example, `12` means scenario EBIT equals scenario revenue multiplied by `12%`. `null` means the Base Case EBIT margin is preserved when revenue changes.

## Transformation Order

Every Scenario Case is recalculated from the original Base Case plus the complete current assumption set. The engine never incrementally mutates a previous scenario result.

The deterministic order is:

1. Revenue growth
2. EBIT margin
3. Total debt
4. Current assets
5. Inventory
6. Interest expense

## Propagation Rules

### Revenue Growth

Source field: `periods[latest].incomeStatement.revenue`

Transformation: revenue is multiplied by `1 + revenueGrowthPercent / 100`.

Dependent fields:

- `periods[latest].incomeStatement.costOfGoodsSold`
- `periods[latest].incomeStatement.ebit`
- `periods[latest].incomeStatement.netIncome`

Balancing assumption: Cost of Goods Sold and Net Income preserve their Base Case revenue margins. EBIT preserves its Base Case margin unless the EBIT Margin control is active.

Limitation: this is a margin-preservation transformation, not a detailed operating-expense or tax model.

### EBIT Margin

Source field: `periods[latest].incomeStatement.ebit`

Transformation: when supplied, EBIT is set to transformed Revenue multiplied by `ebitMarginPercent / 100`.

Dependent field:

- `periods[latest].incomeStatement.ebit`

Balancing assumption: no operating-expense line item is invented.

Limitation: Net Income is not derived from EBIT because tax and other below-operating detail are not supplied.

An EBIT-margin target is therefore an operating sensitivity, not a complete income-statement forecast. It does not model operating expenses, taxes, financing schedules, tax shields or a Net Income reconciliation.

### Total Debt

Source field: `periods[latest].balanceSheet.totalDebt`

Transformation: Total Debt is multiplied by `1 + totalDebtChangePercent / 100`.

Dependent field:

- `periods[latest].balanceSheet.totalDebt`

Balancing assumption: cash, assets and equity are preserved; no financing transaction is inferred.

Limitation: the scenario does not validate a full accounting equation or silently change equity.

### Current Assets

Source field: `periods[latest].balanceSheet.currentAssets`

Transformation: Current Assets are multiplied by `1 + currentAssetsChangePercent / 100`.

Dependent field:

- `periods[latest].balanceSheet.currentAssets`

Balancing assumption: cash and other current-asset components are not adjusted.

Limitation: the scenario is invalid if Current Assets become lower than Inventory or higher than Total Assets.

### Inventory

Source field: `periods[latest].balanceSheet.inventory`

Transformation: Inventory and Average Inventory are multiplied by `1 + inventoryChangePercent / 100`.

Dependent fields:

- `periods[latest].balanceSheet.inventory`
- `periods[latest].workingCapital.averageInventory`

Balancing assumption: inventory changes do not create an equal cash movement.

Limitation: inventory optimisation is not a complete working-capital cash-flow model.

### Interest Expense

Source field: `periods[latest].incomeStatement.interestExpense`

Transformation: Interest Expense is multiplied by `1 + interestExpenseChangePercent / 100`; Net Income is adjusted by the inverse interest-expense delta with no tax effect.

Dependent fields:

- `periods[latest].incomeStatement.interestExpense`
- `periods[latest].incomeStatement.netIncome`

Balancing assumption: debt is preserved unless the Total Debt control is changed separately.

Limitation: no implied interest rate or tax shield is inferred.

## Preset Registry

All presets resolve to the same `ScenarioAssumptions` contract used by manual controls.

| Preset | Assumptions | Purpose |
| --- | --- | --- |
| High Growth | Revenue growth: `+15%`; EBIT margin target: `28%` | Strong revenue growth combined with operating-margin expansion. The EBIT target is an operating sensitivity, not a complete income-statement forecast. |
| Economic Slowdown | Revenue growth: `-10%`; EBIT margin target: `5%` | Revenue contraction combined with operating-margin compression. The EBIT target is an operating sensitivity, not a complete income-statement forecast. |
| Debt Reduction | Total debt change: `-20%`; cash and equity unchanged | Tests reduced debt without inferring a financing transaction or accounting balance. |
| Inventory Optimisation | Inventory and Average Inventory change: `-15%`; cash unchanged | Tests lower inventory and average inventory without assuming cash creation. |
| Higher Interest Rates | Interest expense change: `+30%`; Net Income adjusted by the interest delta without tax; debt unchanged | Tests higher interest expense with a no-tax Net Income passthrough. |

Preset scenarios are not forecasts or probability scenarios.

## Validation

The scenario engine rejects:

- non-finite assumption values;
- revenue growth that would make revenue zero or negative;
- percentage changes that would make non-negative fields negative;
- EBIT margin targets outside `-100%` to `100%`;
- Inventory greater than Current Assets;
- Current Assets greater than Total Assets;
- transformed statements that fail `parseFinancialAnalysisInput()`.

Invalid scenarios are returned as typed errors and must not crash the page.

## Pipeline

The Scenario Lab pipeline is:

```text
Base FinancialAnalysisInput
+ ScenarioAssumptions
→ applyScenario()
→ parseFinancialAnalysisInput()
→ analyseFinancialStatements()
→ ScenarioComparisonViewModel
→ UI
```

The Scenario Lab does not directly edit ratios, dimension scores, total Health Score, insights or DuPont factors.

## Immutability

The Base Case is the original validated financial input. Scenario transformations:

- clone the Base Case;
- transform only the latest reporting period;
- preserve earlier periods exactly;
- never mutate demo fixtures;
- never mutate session-storage data in place;
- recalculate reset from the original Base Case.

## Limitations

The Scenario Lab is a simplified statement-transformation model. It does not implement:

- full balance-sheet balancing;
- operating-expense detail not present in the canonical model;
- tax modelling;
- implied interest-rate modelling;
- multi-period forecasts;
- probability distributions;
- saved or collaborative scenarios.
