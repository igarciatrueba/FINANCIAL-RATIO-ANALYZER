# DATASET_SPECIFICATION.md

# Financial Ratio Analyzer

## Dataset Specification

Version: 1.0

Status: Approved

---

# 1. Purpose

This document defines the financial dataset used throughout the application.

The objective is to create realistic financial data that allows the analytical engine to demonstrate meaningful behaviour.

The dataset is considered part of the product.

It should be treated with the same importance as the source code.

---

# 2. Dataset Philosophy

The financial data should feel authentic.

Users should believe they are analysing a real company.

The objective is not statistical realism.

The objective is business realism.

Every financial statement should tell a coherent story.

---

# 3. Dataset Objectives

The dataset should demonstrate:

- financial growth;
- deteriorating performance;
- improving performance;
- liquidity issues;
- leverage changes;
- operational efficiency;
- profitability trends;
- scenario analysis.

Every analytical module should have meaningful data to display.

---

# 4. Company Strategy

The MVP contains two fictional companies.

Each company represents a different business profile.

---

## Company A

### Name

NovaTech Solutions

Industry

Enterprise Software

Characteristics

- High margins
- Low debt
- Strong cash generation
- Fast revenue growth
- High valuation profile

Purpose

Demonstrate a financially healthy company.

---

## Company B

### Name

Atlas Manufacturing Group

Industry

Industrial Manufacturing

Characteristics

- High assets
- Lower margins
- Inventory intensive
- Higher leverage
- Slower or declining growth

Purpose

Demonstrate a financially stressed industrial company with progressive deterioration.

---

# 5. Reporting Periods

Each company contains three complete fiscal years.

Example

2022

↓

2023

↓

2024

The interface should support comparison across periods.

---

# 6. Financial Statements

Every reporting period includes:

Income Statement

↓

Balance Sheet

↓

Cash Flow Statement

↓

Working Capital Metrics

The statements should always remain internally consistent.

---

# 7. Income Statement Fields

Required fields

Revenue

Cost of Goods Sold

Gross Profit

Operating Expenses

EBIT

Interest Expense

Tax Expense

Net Income

Gross Profit should always equal:

Revenue minus COGS.

Net Income should remain mathematically consistent.

---

# 8. Balance Sheet Fields

Cash

Accounts Receivable

Inventory

Current Assets

Property Plant & Equipment

Total Assets

Accounts Payable

Current Liabilities

Long-Term Debt

Total Liabilities

Equity

Assets must always equal:

Liabilities + Equity.

---

# 9. Cash Flow Fields

Operating Cash Flow

Investing Cash Flow

Financing Cash Flow

Capital Expenditure

Free Cash Flow

Net Change in Cash

Cash Flow statements should reconcile with the Balance Sheet.

---

# 10. Working Capital Fields

Average Inventory

Average Receivables

Average Payables

Inventory Days

Receivable Days

Payable Days

Cash Conversion Cycle

These values drive operational efficiency ratios.

---

# 11. Derived Metrics

The application calculates:

Profitability

Liquidity

Solvency

Efficiency

Cash Flow

Health Score

No derived values should be stored inside the dataset.

Everything should be calculated dynamically.

---

# 12. Data Integrity Rules

Every dataset must satisfy:

Assets = Liabilities + Equity

Operating Cash Flow must be plausible.

Revenue growth should remain coherent.

Debt evolution should make business sense.

Margins should evolve gradually.

No impossible accounting values.

---

# 13. Scenario Compatibility

The dataset must support scenario simulation.

Variables that may change include:

Revenue

Operating Margin

Interest Rate

Debt

CapEx

Inventory

Receivables

These changes should automatically propagate through the analytical engine.

---

# 14. Financial Storytelling

Each company should communicate a narrative.

NovaTech

Growing SaaS company.

Strong profitability.

Healthy balance sheet.

Excellent liquidity.

Increasing cash generation.

---

Atlas Manufacturing

Slower or declining revenue.

Pressure on margins.

Inventory growth.

Higher leverage and low interest coverage.

Working capital challenges and weaker cash-flow conversion.

The analytical engine should naturally identify these characteristics.

---

# 15. Dataset Acceptance Criteria

The dataset is considered complete when:

✓ Every statement balances.

✓ Every ratio produces realistic values.

✓ Every chart appears believable.

✓ Scenario analysis creates meaningful changes.

✓ The Health Score differentiates both companies.

✓ No manual corrections are required inside the application.

---

# End of Section 1

Next Section

Dataset Schema, JSON Structure, Demo Companies & Scenario Catalogue

---

# 16. Canonical Dataset Structure

The application shall use one canonical dataset format.

Every analysis begins from the same schema.

```
Company

↓

Reporting Periods

↓

Financial Statements

↓

Derived Metrics

↓

Health Score

↓

Insights
```

No alternative structures should exist.

---

# 17. JSON Contract

Every company must follow the same schema.

```json
{
  "company": {
    "id": "",
    "name": "",
    "industry": "",
    "currency": "EUR"
  },
  "periods": [
    {
      "year": 2024,
      "incomeStatement": {},
      "balanceSheet": {},
      "cashFlow": {},
      "workingCapital": {}
    }
  ]
}
```

The schema should remain stable.

Future fields may only be appended.

Never renamed.

---

# 18. Financial Data Types

Every numeric value

number

Dates

number (year)

Company name

string

Industry

string

Currency

string

No mixed types.

No null values.

Use zero only when financially meaningful.

---

# 19. Mandatory Fields

Every reporting period must include:

Revenue

COGS

Gross Profit

Operating Expenses

EBIT

Interest Expense

Taxes

Net Income

Cash

Receivables

Inventory

Current Assets

Total Assets

Accounts Payable

Current Liabilities

Long-Term Debt

Total Liabilities

Equity

Operating Cash Flow

Investing Cash Flow

Financing Cash Flow

Capital Expenditure

Average Inventory

Average Receivables

Average Payables

Missing mandatory fields invalidate the dataset.

---

# 20. Financial Constraints

The following conditions must always hold.

Assets = Liabilities + Equity

Gross Profit = Revenue − COGS

EBIT = Gross Profit − Operating Expenses

Net Income must reconcile with taxes and interest.

Free Cash Flow = Operating Cash Flow − Capital Expenditure

Cash movement should reconcile across periods.

No impossible accounting situations.

---

# 21. Demo Companies

## NovaTech Solutions

Sector

Enterprise Software

Profile

- High ROE
- Strong liquidity
- Growing margins
- Low leverage
- Excellent cash generation

Expected Health Score

Approximately

85–95

---

## Atlas Manufacturing Group

Sector

Industrial Manufacturing

Profile

- Slower or declining growth
- Inventory intensive
- Higher leverage
- Working capital pressure
- Lower margins
- Weakening liquidity
- Negative free cash flow in the latest period

Expected Health Score Profile

Approximately

- 2022: 50–60
- 2023: 40–50
- 2024: 25–40

Atlas is intended to demonstrate progressive deterioration rather than a merely moderately weaker company. Under the generic Financial Health Score methodology, the latest period may classify as Weak or Critical when declining profitability, weak liquidity, negative free cash flow, low interest coverage and working-capital pressure occur together.

Both companies should produce clearly different analytical conclusions.

---

# 22. Scenario Catalogue

The MVP includes predefined scenarios.

## Scenario 1

High Growth

Changes

+15% Revenue

+5% Operating Expenses

Expected Result

Improved profitability.

Higher score.

---

## Scenario 2

Economic Slowdown

Changes

−10% Revenue

Stable debt

Lower margins

Expected Result

Reduced profitability.

Lower score.

---

## Scenario 3

Debt Reduction

Changes

−20% Long-Term Debt

Expected Result

Improved solvency.

Improved Interest Coverage.

---

## Scenario 4

Inventory Optimisation

Changes

−15% Inventory

Expected Result

Improved Cash Conversion Cycle.

Higher efficiency.

---

## Scenario 5

Higher Interest Rates

Changes

+30% Interest Expense

Expected Result

Lower Net Income.

Lower Interest Coverage.

---

# 23. Expected Behaviour

Changing any scenario should automatically update:

Financial Ratios

↓

Health Score

↓

Charts

↓

Insights

↓

Dashboard

No manual recalculation should be required.

---

# 24. Dataset Validation Rules

Before analysis begins verify:

✓ Required fields

✓ Positive asset values

✓ Balance Sheet integrity

✓ Cash Flow consistency

✓ Valid reporting years

✓ Numeric fields

If validation fails:

Return meaningful validation errors.

Never continue with invalid data.

---

# 25. Future Compatibility

The schema should support future additions:

- CSV Import
- Excel Import
- API Integration
- Multiple Companies
- Quarterly Statements
- Industry Benchmarks

Without breaking the existing structure.

---

# 26. Dataset Quality Checklist

The dataset is approved when:

✓ Statements balance.

✓ Ratios are realistic.

✓ Trends are believable.

✓ Charts tell a coherent story.

✓ Both companies differ significantly.

✓ Scenario simulation behaves consistently.

✓ Every financial insight is explainable.

---

# 27. Dataset Governance

Financial data must never be hardcoded inside React components.

The dataset should exist independently from:

UI

↓

Charts

↓

Analysis Engine

↓

Scenario Engine

This separation guarantees maintainability.

---

# 28. Final Dataset Statement

The dataset is a strategic asset of the project.

It is not demonstration data.

It is a reproducible financial model designed to validate the analytical engine and showcase the capabilities of the application.

Future contributors should treat changes to the dataset with the same discipline as changes to source code.

---

# Revision History

Version

1.0

Status

Approved

Related Documents

PRODUCT_REQUIREMENTS_SPECIFICATION.md

DESIGN_SYSTEM.md

VISUAL_DIRECTION.md

PROJECT_PRINCIPLES.md

CODEX_WORKFLOW.md

End of Document
