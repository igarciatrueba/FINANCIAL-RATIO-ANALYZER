# Financial Ratio Analyzer: Product Context

## What it is

Financial Ratio Analyzer is a browser-local financial intelligence application for analysing **three annual periods** of simplified corporate statements. It turns a validated canonical dataset into ratios, a transparent 0-100 Financial Health Score, deterministic strengths and risks, a DuPont ROE explanation, statement-based scenarios, and a printable executive report.

It is an educational, explainable analytical product. It is not accounting software, an audit, a credit rating, an investment recommendation, or a forecast service.

## Users and problem

Primary users are junior financial analysts, students, graduates, and reviewers who need to understand how income statement, balance sheet, cash flow, and working-capital inputs connect. The product removes manual calculation and makes the reasoning visible: what the condition is, why it changed, and which evidence supports it.

## Product promise and philosophy

The core promise is **transparent financial statements to decision-ready insight**. The product values understanding over opaque sophistication:

- deterministic calculations, no generative analysis;
- every score and insight can be traced to formulas, thresholds, or supplied values;
- unavailable data stays unavailable rather than becoming zero;
- generic thresholds are educational, not sector-authoritative;
- the UI must explain relationships, not merely decorate metrics.

The score disclaimer is mandatory: it is an educational assessment, not a credit rating, audit opinion, investment recommendation, or substitute for professional judgement.

## Primary workflows

1. Start at the landing page, then enter statements manually or load a fictional demo.
2. Complete Company, Income Statement, Balance Sheet, Cash Flow, Working Capital, and Review steps.
3. Submit a valid canonical `FinancialAnalysisInput`; it is stored temporarily for analysis.
4. Read the Executive Dashboard, then drill into ratio analysis or DuPont.
5. Transform the latest period in Scenario Lab and compare it with the immutable Base Case.
6. Consult Methodology and Engine Map to understand formulas, limits, and the pipeline.
7. Print/save a report from analysis pages where available.

## Product hierarchy

- **Executive:** Financial Health Score, diagnosis, principal strengths/risks, KPIs, dimensions.
- **Analyst:** full ratio table, selectable trend, working-capital cycle, profitability bridge, score contributions.
- **Explainability:** score coverage/drivers, deterministic insights, DuPont identity/attribution, methodology.
- **Experimentation:** six scenario assumptions and five presets, all re-analysed through the same engine.

## What distinguishes it from a generic dashboard

The dashboard is only a projection of a strict domain engine. Inputs are canonicalised first; score and insight results are reproducible; the chart layer receives view models rather than recalculating finance; and Scenario Lab changes financial statements before recalculation instead of editing ratios or scores directly.

## Demo profiles

- **NovaTech Solutions** (Enterprise Software, EUR): fictional healthy growth, strong margins/cash generation, controlled debt.
- **Atlas Manufacturing Group** (Industrial Manufacturing, EUR): fictional inventory-intensive, leveraged company with progressive stress and deterioration.

The demos are fixtures copied before use and must never be mutated at source.
