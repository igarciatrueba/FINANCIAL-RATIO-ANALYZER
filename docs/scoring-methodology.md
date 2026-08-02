# Financial Health Score Methodology

## Disclaimer

The Financial Health Score is a transparent educational assessment based on the supplied financial statements and generic analytical thresholds. It is not a credit rating, audit opinion, investment recommendation or substitute for professional judgement.

The score is generic and not sector-authoritative. It should be read as an explainable analytical indicator, not as a professional conclusion.

## Dimensions

The score ranges from 0 to 100 and uses five dimensions:

| Dimension | Weight |
|---|---:|
| Profitability | 0.25 |
| Liquidity | 0.20 |
| Solvency | 0.20 |
| Efficiency | 0.15 |
| Cash Flow | 0.20 |

Configuration validation requires the dimension weights to total 1.0.

## Scored Metrics

Profitability:

- EBIT Margin: 0.25
- Net Margin: 0.20
- Return on Assets: 0.20
- Return on Equity: 0.15
- Return on Capital Employed: 0.20

Liquidity:

- Current Ratio: 0.25
- Quick Ratio: 0.30
- Cash Ratio: 0.15
- Operating Cash Flow Ratio: 0.30

Solvency:

- Debt-to-Equity: 0.25
- Debt-to-Assets: 0.25
- Equity Ratio: 0.20
- Interest Coverage: 0.30

Efficiency:

- Asset Turnover: 0.20
- Days Sales Outstanding: 0.20
- Days Inventory Outstanding: 0.20
- Cash Conversion Cycle: 0.40

Cash Flow:

- Operating Cash Flow Margin: 0.35
- Free Cash Flow Margin: 0.35
- Operating Cash Flow to Net Income: 0.30

Metric weights must total 1.0 inside each dimension.

## Excluded Metrics

The following implemented ratios remain available for analysis and insight evidence but are not scored:

- Gross Profit
- Gross Margin
- absolute Free Cash Flow
- Inventory Turnover
- Receivables Turnover
- Days Payables Outstanding

## Thresholds and Interpolation

Each scored metric uses declarative score anchors. Scores are calculated with piecewise linear interpolation between the nearest anchors.

Supported threshold modes:

- `higher-is-better`
- `lower-is-better`
- `target-range`

Values outside the configured anchor range use the nearest endpoint score. Scores are clipped between 0 and 100. The domain does not round internal score values.

## Anchor Catalogue

All percentage metrics use decimal values.

Profitability anchors:

- EBIT Margin: `0 -> 0`, `0.05 -> 25`, `0.10 -> 50`, `0.15 -> 75`, `0.20 -> 100`
- Net Margin: `0 -> 0`, `0.03 -> 25`, `0.07 -> 50`, `0.12 -> 75`, `0.18 -> 100`
- Return on Assets: `0 -> 0`, `0.03 -> 25`, `0.06 -> 50`, `0.10 -> 75`, `0.15 -> 100`
- Return on Equity: `0 -> 0`, `0.08 -> 25`, `0.12 -> 50`, `0.18 -> 75`, `0.25 -> 100`
- Return on Capital Employed: `0 -> 0`, `0.06 -> 25`, `0.10 -> 50`, `0.15 -> 75`, `0.20 -> 100`

Liquidity anchors:

- Current Ratio: `0.50 -> 0`, `0.80 -> 25`, `1.00 -> 50`, `1.50 -> 100`, `2.50 -> 100`, `3.50 -> 75`, `5.00 -> 50`
- Quick Ratio: `0.40 -> 0`, `0.70 -> 25`, `0.90 -> 50`, `1.00 -> 100`, `1.80 -> 100`, `2.50 -> 75`, `4.00 -> 50`
- Cash Ratio: `0.05 -> 0`, `0.10 -> 25`, `0.20 -> 50`, `0.30 -> 100`, `0.80 -> 100`, `1.20 -> 75`, `2.00 -> 50`
- Operating Cash Flow Ratio: `0 -> 0`, `0.20 -> 25`, `0.50 -> 50`, `0.80 -> 75`, `1.20 -> 100`

Solvency anchors:

- Debt-to-Equity: `0.50 -> 100`, `1.00 -> 75`, `1.50 -> 50`, `2.00 -> 25`, `3.00 -> 0`
- Debt-to-Assets: `0.20 -> 100`, `0.35 -> 75`, `0.50 -> 50`, `0.60 -> 25`, `0.70 -> 0`
- Equity Ratio: `0.15 -> 0`, `0.25 -> 25`, `0.35 -> 50`, `0.50 -> 75`, `0.65 -> 100`
- Interest Coverage: `1.00 -> 0`, `1.50 -> 25`, `3.00 -> 50`, `5.00 -> 75`, `8.00 -> 100`

Efficiency anchors:

- Asset Turnover: `0.25 -> 0`, `0.50 -> 25`, `0.80 -> 50`, `1.20 -> 75`, `1.80 -> 100`
- Days Sales Outstanding: `30 -> 100`, `45 -> 75`, `60 -> 50`, `90 -> 25`, `120 -> 0`
- Days Inventory Outstanding: `30 -> 100`, `60 -> 75`, `90 -> 50`, `120 -> 25`, `180 -> 0`
- Cash Conversion Cycle: `30 -> 100`, `60 -> 75`, `90 -> 50`, `120 -> 25`, `180 -> 0`

Cash-flow anchors:

- Operating Cash Flow Margin: `0 -> 0`, `0.05 -> 25`, `0.10 -> 50`, `0.15 -> 75`, `0.20 -> 100`
- Free Cash Flow Margin: `0 -> 0`, `0.03 -> 25`, `0.07 -> 50`, `0.12 -> 75`, `0.18 -> 100`
- Operating Cash Flow to Net Income: `0 -> 0`, `0.50 -> 25`, `0.80 -> 50`, `1.00 -> 100`, `1.50 -> 100`, `2.00 -> 75`, `3.00 -> 50`, `4.00 -> 25`

## Missing Data Policy

Unavailable metrics never receive a zero score.

Dimension coverage is:

```text
available configured metric weight / total configured metric weight
```

A dimension is available only when:

- weighted coverage is at least 60%;
- at least two configured metrics are available.

When a dimension is available but some metrics are unavailable, valid metrics are reweighted inside that dimension.

Total analytical coverage is:

```text
sum(dimension weight * dimension metric coverage)
```

A total score is available only when:

- total analytical coverage is at least 70%;
- at least four of five dimensions are available.

Unavailable dimensions are excluded from total score calculation, and remaining available dimensions are reweighted. Original analytical coverage is still disclosed.

## Classification

Classification uses the unrounded total score:

| Score | Classification |
|---:|---|
| 80 to 100 | Strong |
| 65 to below 80 | Healthy |
| 50 to below 65 | Moderate |
| 35 to below 50 | Weak |
| 0 to below 35 | Critical |
| null | Unavailable |

## Score History

Scores are calculated for all three reporting periods.

Current score change is:

```text
current total score - previous total score
```

The change is `null` if either period score is unavailable.

Trend labels:

- `improving`: change >= 5
- `deteriorating`: change <= -5
- `stable`: change between -2 and 2 inclusive
- `mixed`: all other available changes

## Dimensions and Drivers

Strongest and weakest dimensions use only available dimensions.

Tie-breaking:

1. higher configured dimension weight;
2. stable configuration order: profitability, liquidity, solvency, efficiency, cash-flow.

Metric drivers preserve:

- metric id;
- dimension;
- raw metric result;
- metric score;
- configured weight;
- effective dimension weight;
- effective total weight;
- contribution.

Driver impact is:

```text
(metric score - 50) * effective total weight
```

The engine returns the top three positive and top three negative drivers using stable deterministic ordering.

## Deterministic Insights

Insights are generated by pure configured rules. Generative AI is not used.

Every insight includes:

- id;
- rule id;
- title;
- fixed deterministic explanation;
- category;
- severity;
- affected year;
- trend;
- priority;
- supporting metric ids;
- structured quantitative evidence.

Ordering is deterministic:

1. priority descending;
2. severity high, medium, low;
3. stable rule configuration order;
4. rule id.

Principal insight selection returns no more than three strengths and three risks.

Implemented rules cover margins, liquidity, leverage, interest coverage, working-capital efficiency, free cash flow, cash-flow support for earnings, leverage-driven ROE, score movement, persistent profitability, margin-cash divergence, balance-sheet deleveraging and insufficient analytical coverage.

## Limitations

The methodology uses generic thresholds and simplified financial statements. It does not adjust for industry, company maturity, accounting policy, geography, inflation, seasonality or capital-market context.

The result is deterministic and explainable, but it remains an educational analytical indicator rather than a sector-authoritative assessment.
