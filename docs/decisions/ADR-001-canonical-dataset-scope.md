# ADR-001: Canonical Dataset Scope

## Status

Approved

## Context

The Financial Ratio Analyzer MVP supports exactly three annual reporting periods and analyses simplified corporate financial statements locally in the browser.

The product requirements define a lean manual input model as the canonical analysis input. The dataset specification also describes richer fictional demo data that may contain additional fields for storytelling and reconciliation.

Without an explicit boundary, the implementation could accidentally treat derived analytical outputs or optional demo-only fields as required user input.

## Decision

The canonical required model for manual input is the lean model defined in the PRD.

Required income statement fields are:

- revenue
- costOfGoodsSold
- ebit
- interestExpense
- netIncome

Required balance sheet fields are:

- cash
- accountsReceivable
- inventory
- currentAssets
- totalAssets
- currentLiabilities
- totalDebt
- equity

Required cash flow fields are:

- operatingCashFlow
- capitalExpenditure

Required working capital fields are:

- averageInventory
- averageReceivables
- averagePayables

Capital expenditure is represented as a positive expenditure.

The domain model may support optional extended demo fields, including:

- grossProfit
- operatingExpenses
- taxExpense
- accountsPayable
- propertyPlantEquipment
- longTermDebt
- totalLiabilities
- investingCashFlow
- financingCashFlow
- netChangeInCash

Derived analytical outputs are never stored in `FinancialAnalysisInput`. This includes:

- derived metrics
- ratios
- score results
- deterministic insights
- scenario outputs

Full accounting-equation validation must only run when sufficient independent fields exist. The implementation must not derive total liabilities from assets minus equity and then claim the accounting equation has been independently validated.

## Consequences

The canonical input remains small enough for the MVP manual form and deterministic validation boundary.

Demo datasets can later provide richer optional fields without making those fields mandatory for users.

Formula, scoring, insight and scenario modules must derive their outputs from the canonical input rather than storing analytical results inside source data.

Financial relationship validation can be added incrementally, but it must distinguish independently supplied data from derived values.

## Rejected Alternatives

### Require every dataset-specification field in manual input

Rejected because it would make the MVP form feel closer to a spreadsheet and would exceed the lean PRD input scope.

### Store derived metrics in canonical input

Rejected because it would duplicate business logic, increase drift risk and violate the requirement that analytical outputs are deterministic and reproducible from source statements.

### Always validate the accounting equation by deriving missing liabilities

Rejected because this creates circular validation. The equation can only be independently checked when the necessary independent fields are available.
