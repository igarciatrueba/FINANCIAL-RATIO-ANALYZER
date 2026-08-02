# ADR-002: Financial Health Score Methodology

## Status

Approved for Phase 5 implementation.

## Context

The Financial Ratio Analyzer needs to transform calculated ratios into an explainable educational score and deterministic insights. The score must be reproducible, configuration-driven and independent from React, charts, external services and generative AI.

The methodology must also avoid credit-rating or investment-recommendation claims.

## Decision

Phase 5 implements a pure-domain scoring and insight engine.

The score uses five weighted dimensions:

- Profitability: 0.25
- Liquidity: 0.20
- Solvency: 0.20
- Efficiency: 0.15
- Cash Flow: 0.20

Each dimension contains configured metric weights and declarative threshold anchors. Metric scores use piecewise linear interpolation and are clipped between 0 and 100.

Unavailable metrics are excluded rather than scored as zero. Dimension and total scores disclose analytical coverage and reweight only available metrics or dimensions when coverage thresholds are satisfied.

The deterministic insight engine uses pure rules with fixed wording and structured evidence. Insight ordering is stable and does not depend on rendering order, random values, network state or AI services.

The methodology disclaimer is:

> The Financial Health Score is a transparent educational assessment based on the supplied financial statements and generic analytical thresholds. It is not a credit rating, audit opinion, investment recommendation or substitute for professional judgement.

## Consequences

Scores are transparent and traceable to ratio outputs, thresholds and weights.

The model is generic and suitable for an educational portfolio product, but it is not sector-authoritative. Future sector benchmarks may require an approved methodology change.

Missing data is visible through coverage rather than hidden through zero substitutions.

Insights are reproducible because rule triggers, priorities, severity and ordering are deterministic.

## Rejected Alternatives

### Assign unavailable metrics a zero score

Rejected because it would punish missing or unavailable data as if it represented poor performance and would violate the explicit missing-data policy.

### Use a generative model for narrative insights

Rejected because the MVP requires deterministic, auditable insight generation.

### Use sector-specific thresholds in Phase 5

Rejected because the MVP has no authoritative sector benchmark source and must avoid overclaiming professional judgement.

### Implement score UI in Phase 5

Rejected because the executive dashboard and visual implementation belong to Phase 6.
