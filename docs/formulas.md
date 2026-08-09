# Financial Ratio Formula Catalogue

## Scope

This catalogue documents the formulas implemented by the Phase 3 Financial Calculation Engine.

All percentages are stored internally as decimal values. For example, `0.25` represents `25%`.

The financial engine does not round values. Rounding and formatting belong to the presentation layer.

Capital expenditure is represented as a positive expenditure.

## Safe Arithmetic

All division-based formulas use the shared safe-division policy.

The engine:

- returns typed `MetricResult` values;
- preserves genuine zero results when the numerator is zero;
- never returns `NaN`;
- never returns `Infinity`;
- returns `zero-denominator` when a denominator is zero;
- returns `non-meaningful-denominator` when a formula explicitly treats a negative denominator as financially non-meaningful;
- does not apply one global rule to all negative denominators.

## Average-Balance Convention

Where average balances are required:

```text
Average Balance = (Previous Period Closing Balance + Current Period Closing Balance) / 2
```

For the oldest reporting period, when no previous period exists, the engine uses the current period closing balance as the documented fallback.

## Profitability

### Gross Profit

Definition: revenue remaining after cost of goods sold.

Formula:

```text
Revenue - Cost of Goods Sold
```

Required inputs:

- revenue
- costOfGoodsSold

Unit: currency.

Interpretation: higher gross profit indicates more revenue remains to fund operating costs and profit.

Unavailable conditions: unavailable when required inputs are missing or non-finite.

Limitations: gross profit does not include operating expenses, interest or taxes.

### Gross Margin

Definition: percentage of revenue remaining after cost of goods sold.

Formula:

```text
(Revenue - Cost of Goods Sold) / Revenue
```

Required inputs:

- revenue
- costOfGoodsSold

Unit: percentage decimal.

Interpretation: higher gross margin indicates stronger direct profitability.

Unavailable conditions:

- revenue is zero;
- revenue is negative and non-meaningful for this margin.

Limitations: gross margin does not explain operating cost structure.

### EBIT Margin

Definition: operating profit before interest and taxes as a percentage of revenue.

Formula:

```text
EBIT / Revenue
```

Required inputs:

- ebit
- revenue

Unit: percentage decimal.

Interpretation: higher EBIT margin indicates stronger operating profitability.

Unavailable conditions:

- revenue is zero;
- revenue is negative and non-meaningful for this margin.

Limitations: EBIT margin excludes financing and tax effects.

### Net Margin

Definition: net income as a percentage of revenue.

Formula:

```text
Net Income / Revenue
```

Required inputs:

- netIncome
- revenue

Unit: percentage decimal.

Interpretation: higher net margin indicates more revenue converts into final profit.

Unavailable conditions:

- revenue is zero;
- revenue is negative and non-meaningful for this margin.

Limitations: net margin can be affected by non-operating items.

### Return on Assets

Definition: net income generated per unit of average total assets.

Formula:

```text
Net Income / Average Total Assets
```

Required inputs:

- netIncome
- totalAssets
- previous period totalAssets where available

Unit: percentage decimal.

Average-balance convention: uses average total assets. For the oldest period, current closing total assets are used as fallback.

Interpretation: higher ROA indicates more effective asset use.

Unavailable conditions:

- average total assets are zero;
- average total assets are negative and non-meaningful.

Limitations: asset-heavy and asset-light companies may not be directly comparable without industry context.

### Return on Equity

Definition: net income generated per unit of average equity.

Formula:

```text
Net Income / Average Equity
```

Required inputs:

- netIncome
- equity
- previous period equity where available

Unit: percentage decimal.

Average-balance convention: uses average equity. For the oldest period, current closing equity is used as fallback.

Interpretation: higher ROE indicates stronger returns to equity holders, subject to leverage context.

Unavailable conditions:

- average equity is zero;
- average equity is negative and non-meaningful for the standard ROE interpretation.

Limitations: ROE can be elevated by leverage rather than operating strength.

### Return on Capital Employed

Definition: EBIT generated per unit of average capital employed.

Formula:

```text
EBIT / Average Capital Employed
Capital Employed = Total Assets - Current Liabilities
```

Required inputs:

- ebit
- totalAssets
- currentLiabilities
- previous period totalAssets and currentLiabilities where available

Unit: percentage decimal.

Average-balance convention: uses average capital employed. For the oldest period, current closing capital employed is used as fallback.

Interpretation: higher ROCE indicates stronger operating returns on deployed capital.

Unavailable conditions:

- average capital employed is zero;
- average capital employed is negative and non-meaningful.

Limitations: simplified capital employed excludes more detailed capital-structure adjustments.

## Liquidity

### Current Ratio

Definition: current assets available for each unit of current liabilities.

Formula:

```text
Current Assets / Current Liabilities
```

Required inputs:

- currentAssets
- currentLiabilities

Unit: multiple.

Interpretation: higher values indicate more short-term asset coverage.

Unavailable conditions:

- current liabilities are zero;
- current liabilities are negative and non-meaningful.

Limitations: current ratio does not evaluate asset quality or timing.

### Quick Ratio

Definition: liquid current assets available for each unit of current liabilities.

Formula:

```text
(Current Assets - Inventory) / Current Liabilities
```

Required inputs:

- currentAssets
- inventory
- currentLiabilities

Unit: multiple.

Interpretation: higher values indicate stronger near-cash liquidity.

Unavailable conditions:

- current liabilities are zero;
- current liabilities are negative and non-meaningful.

Limitations: receivables collectability is not independently assessed.

### Cash Ratio

Definition: cash available for each unit of current liabilities.

Formula:

```text
Cash / Current Liabilities
```

Required inputs:

- cash
- currentLiabilities

Unit: multiple.

Interpretation: higher values indicate stronger immediate liquidity.

Unavailable conditions:

- current liabilities are zero;
- current liabilities are negative and non-meaningful.

Limitations: cash ratio can be conservative and does not include receivables.

### Operating Cash Flow Ratio

Definition: operating cash flow available for each unit of current liabilities.

Formula:

```text
Operating Cash Flow / Current Liabilities
```

Required inputs:

- operatingCashFlow
- currentLiabilities

Unit: multiple.

Interpretation: higher values indicate stronger cash-based short-term coverage.

Unavailable conditions:

- current liabilities are zero;
- current liabilities are negative and non-meaningful.

Limitations: one period of operating cash flow may not represent recurring cash generation.

## Solvency

### Debt-to-Equity

Definition: debt financing relative to equity financing.

Formula:

```text
Total Debt / Equity
```

Required inputs:

- totalDebt
- equity

Unit: multiple.

Interpretation: lower values generally indicate less financial leverage.

Unavailable conditions:

- equity is zero;
- equity is negative and non-meaningful.

Limitations: this simplified measure does not distinguish debt maturity or covenants.

### Debt-to-Assets

Definition: share of assets financed by debt.

Formula:

```text
Total Debt / Total Assets
```

Required inputs:

- totalDebt
- totalAssets

Unit: percentage decimal.

Interpretation: lower values generally indicate lower balance-sheet leverage.

Unavailable conditions:

- total assets are zero;
- total assets are negative and non-meaningful.

Limitations: total debt may not capture all financing obligations.

### Equity Ratio

Definition: share of assets financed by equity.

Formula:

```text
Equity / Total Assets
```

Required inputs:

- equity
- totalAssets

Unit: percentage decimal.

Interpretation: higher values generally indicate a stronger equity buffer.

Unavailable conditions:

- total assets are zero;
- total assets are negative and non-meaningful.

Limitations: equity book values may differ from market values.

### Interest Coverage

Definition: EBIT available for each unit of interest expense.

Formula:

```text
EBIT / Interest Expense
```

Required inputs:

- ebit
- interestExpense

Unit: multiple.

Interpretation: higher values indicate stronger capacity to service interest.

Unavailable conditions:

- interest expense is zero;
- interest expense is negative and non-meaningful for this ratio.

Limitations: this ratio does not evaluate debt principal repayments.

## Efficiency

### Asset Turnover

Definition: revenue generated per unit of average total assets.

Formula:

```text
Revenue / Average Total Assets
```

Required inputs:

- revenue
- totalAssets
- previous period totalAssets where available

Unit: multiple.

Average-balance convention: uses average total assets. For the oldest period, current closing total assets are used as fallback.

Interpretation: higher values indicate more efficient use of assets to generate revenue.

Unavailable conditions:

- average total assets are zero;
- average total assets are negative and non-meaningful.

Limitations: asset turnover varies significantly by industry.

### Inventory Turnover

Definition: cost of goods sold generated per unit of average inventory.

Formula:

```text
Cost of Goods Sold / Average Inventory
```

Required inputs:

- costOfGoodsSold
- averageInventory

Unit: multiple.

Interpretation: higher values indicate inventory is converted into sales more quickly.

Unavailable conditions:

- average inventory is zero;
- average inventory is negative and non-meaningful.

Limitations: the canonical input uses explicit average inventory rather than deriving it from opening and closing inventory.

### Receivables Turnover

Definition: revenue generated per unit of average receivables.

Formula:

```text
Revenue / Average Receivables
```

Required inputs:

- revenue
- averageReceivables

Unit: multiple.

Interpretation: higher values indicate receivables are collected more quickly.

Unavailable conditions:

- average receivables are zero;
- average receivables are negative and non-meaningful.

Limitations: the canonical input uses explicit average receivables rather than deriving them from opening and closing receivables.

### Days Sales Outstanding

Definition: average number of days revenue remains in receivables.

Formula:

```text
Average Receivables / Revenue * 365
```

Required inputs:

- averageReceivables
- revenue

Unit: days.

Interpretation: lower values indicate faster receivables collection.

Unavailable conditions:

- revenue is zero;
- revenue is negative and non-meaningful.

Limitations: the formula assumes annual revenue and a 365-day year.

### Days Inventory Outstanding

Definition: average number of days inventory is held before sale.

Formula:

```text
Average Inventory / Cost of Goods Sold * 365
```

Required inputs:

- averageInventory
- costOfGoodsSold

Unit: days.

Interpretation: lower values indicate faster inventory conversion.

Unavailable conditions:

- cost of goods sold is zero;
- cost of goods sold is negative and non-meaningful.

Limitations: the formula assumes annual cost of goods sold and a 365-day year.

### Days Payables Outstanding

Definition: average number of days payables remain outstanding.

Formula:

```text
Average Payables / Cost of Goods Sold * 365
```

Required inputs:

- averagePayables
- costOfGoodsSold

Unit: days.

Interpretation: higher values indicate the company takes longer to pay suppliers.

Unavailable conditions:

- cost of goods sold is zero;
- cost of goods sold is negative and non-meaningful.

Limitations: the canonical input uses explicit average payables rather than deriving them from opening and closing payables.

### Cash Conversion Cycle

Definition: time between cash invested in working capital and cash collected from customers.

Formula:

```text
DIO + DSO - DPO
```

Required inputs:

- Days Inventory Outstanding
- Days Sales Outstanding
- Days Payables Outstanding

Unit: days.

Interpretation: lower values indicate a shorter working-capital cash cycle.

Unavailable conditions:

- DIO is unavailable;
- DSO is unavailable;
- DPO is unavailable.

Limitations: CCC inherits the limitations of DIO, DSO and DPO.

## Cash Flow

### Operating Cash Flow Margin

Definition: operating cash flow generated per unit of revenue.

Formula:

```text
Operating Cash Flow / Revenue
```

Required inputs:

- operatingCashFlow
- revenue

Unit: percentage decimal.

Interpretation: higher values indicate stronger cash conversion from sales.

Unavailable conditions:

- revenue is zero;
- revenue is negative and non-meaningful.

Limitations: this measure can be affected by working-capital timing.

### Free Cash Flow

Definition: cash remaining after capital expenditure.

Formula:

```text
Operating Cash Flow - Capital Expenditure
```

Required inputs:

- operatingCashFlow
- capitalExpenditure

Unit: currency.

Interpretation: higher values indicate more discretionary cash generation after reinvestment.

Unavailable conditions: unavailable when required inputs are missing or non-finite.

Limitations: capital expenditure is represented as a positive expenditure in the canonical input.

### Free Cash Flow Margin

Definition: free cash flow generated per unit of revenue.

Formula:

```text
(Operating Cash Flow - Capital Expenditure) / Revenue
```

Required inputs:

- operatingCashFlow
- capitalExpenditure
- revenue

Unit: percentage decimal.

Interpretation: higher values indicate stronger post-investment cash generation from sales.

Unavailable conditions:

- revenue is zero;
- revenue is negative and non-meaningful.

Limitations: this measure depends on the positive-expenditure CapEx convention.

### Operating Cash Flow to Net Income

Definition: operating cash flow compared with net income.

Formula:

```text
Operating Cash Flow / Net Income
```

Required inputs:

- operatingCashFlow
- netIncome

Unit: multiple.

Interpretation: values above one indicate cash flow exceeds accounting earnings.

Unavailable conditions:

- net income is zero.

Limitations: negative net income remains calculable by design, so interpretation requires context.

## DuPont

### Three-Step DuPont Identity

Definition: ROE decomposition into profitability, asset efficiency and financial leverage.

Formula:

```text
ROE = Net Profit Margin * Asset Turnover * Financial Leverage
Financial Leverage = Average Total Assets / Average Equity
```

Required inputs:

- netIncome
- revenue
- totalAssets
- equity
- previous period totalAssets where available
- previous period equity where available

Unit: mixed decomposition; ROE and net margin are percentage decimals, asset turnover and financial leverage are multiples.

Average-balance convention: asset turnover uses average total assets and financial leverage uses average total assets divided by average equity. For the oldest period, current closing balances are used as fallback.

Interpretation: the decomposition explains whether ROE is driven by profitability, asset efficiency or leverage.

Unavailable conditions:

- any component is unavailable;
- average equity is zero;
- average equity is negative and non-meaningful.

Limitations: the Phase 3 primitive reports reconciliation status only. Driver interpretation belongs to later DuPont and insight phases.

### ROE Driver Attribution

Definition: deterministic attribution of the current-versus-previous ROE movement to the three DuPont factors.

Method:

```text
ROE = Net Profit Margin * Asset Turnover * Financial Leverage
```

For the current and previous reporting periods, the attribution evaluates all six possible substitution orders for:

- Net Profit Margin;
- Asset Turnover;
- Financial Leverage.

For each order, one factor is substituted from its previous-period value to its current-period value while the other factors remain at the values present at that step. The factor receives the marginal ROE change created by that substitution. The final contribution for each factor is the average of its marginal contributions across all six orders.

This is an exact Shapley decomposition for the three-factor multiplicative identity. It is deterministic and order-independent.

Reconciliation:

```text
Margin contribution
+ Asset Turnover contribution
+ Financial Leverage contribution
= Current ROE - Previous ROE
```

Internal calculations use unrounded values. The reconciliation tolerance is `1e-12`. If the contribution sum does not reconcile to the ROE movement within tolerance, no residual is assigned silently; attribution is reported as unavailable.

Unavailable conditions:

- current or previous ROE is unavailable;
- current or previous Net Profit Margin is unavailable;
- current or previous Asset Turnover is unavailable;
- current or previous Financial Leverage is unavailable;
- the contribution sum does not reconcile within tolerance.

Interpretation: attribution identifies which factor is most associated with the period-over-period ROE movement. It is a mathematical decomposition of supplied statements and does not prove business causality, creditworthiness, investment attractiveness or audit assurance.
