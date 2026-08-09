# Methodology

## Overview

The Financial Ratio Analyzer is a deterministic educational analysis tool for three annual reporting periods. It validates a canonical input, calculates registered financial metrics, produces DuPont and Financial Health Score outputs, and exposes rule-based insights. It is not a credit rating, audit opinion, investment recommendation or substitute for professional judgement.

## Documentation map

- [Formula catalogue](formulas.md): implemented ratios, units, definitions and availability conditions.
- [Scoring methodology](scoring-methodology.md): score anchors, coverage, classification and deterministic insights.
- [Scenario methodology](scenario-methodology.md): immutable Base Case transformations, assumptions and limitations.
- Engine Map: available in the application at `/engine-map`.

## Input and availability

The canonical model requires company context and exactly three chronological annual periods. Empty browser input is never converted to zero. Safe arithmetic emits an unavailable result when a denominator or required input is unsuitable; unavailable values are excluded according to the documented coverage policy rather than scored as zero.

## DuPont and scenarios

DuPont reconciles Return on Equity as Net Profit Margin multiplied by Asset Turnover and Financial Leverage. Current-versus-prior attribution uses an order-independent Shapley decomposition with no hidden residual. Scenario Lab transforms latest-period statements from an immutable Base Case, canonically revalidates the result, and reuses the same ratio, DuPont, scoring and insight engines. Scenarios are sensitivities, not forecasts.

## Demo disclosure

NovaTech Solutions and Atlas Manufacturing Group are fictional demonstration companies. Their financial values, score outputs and insights do not represent real companies.
