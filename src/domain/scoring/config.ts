import type { RatioCategory, ScoringConfiguration } from "@/domain/types";

export const SCORE_DISCLAIMER =
  "The Financial Health Score is a transparent educational assessment based on the supplied financial statements and generic analytical thresholds. It is not a credit rating, audit opinion, investment recommendation or substitute for professional judgement.";

export const dimensionOrder: RatioCategory[] = ["profitability", "liquidity", "solvency", "efficiency", "cash-flow"];

export const defaultScoringConfig: ScoringConfiguration = {
  disclaimer: SCORE_DISCLAIMER,
  dimensionWeights: {
    profitability: 0.25,
    liquidity: 0.2,
    solvency: 0.2,
    efficiency: 0.15,
    "cash-flow": 0.2,
  },
  metricWeights: {
    profitability: {
      "ebit-margin": 0.25,
      "net-margin": 0.2,
      "return-on-assets": 0.2,
      "return-on-equity": 0.15,
      "return-on-capital-employed": 0.2,
    },
    liquidity: {
      "current-ratio": 0.25,
      "quick-ratio": 0.3,
      "cash-ratio": 0.15,
      "operating-cash-flow-ratio": 0.3,
    },
    solvency: {
      "debt-to-equity": 0.25,
      "debt-to-assets": 0.25,
      "equity-ratio": 0.2,
      "interest-coverage": 0.3,
    },
    efficiency: {
      "asset-turnover": 0.2,
      "days-sales-outstanding": 0.2,
      "days-inventory-outstanding": 0.2,
      "cash-conversion-cycle": 0.4,
    },
    "cash-flow": {
      "operating-cash-flow-margin": 0.35,
      "free-cash-flow-margin": 0.35,
      "operating-cash-flow-to-net-income": 0.3,
    },
  },
  thresholds: {
    "ebit-margin": {
      metricId: "ebit-margin",
      mode: "higher-is-better",
      anchors: [
        { value: 0, score: 0 },
        { value: 0.05, score: 25 },
        { value: 0.1, score: 50 },
        { value: 0.15, score: 75 },
        { value: 0.2, score: 100 },
      ],
    },
    "net-margin": {
      metricId: "net-margin",
      mode: "higher-is-better",
      anchors: [
        { value: 0, score: 0 },
        { value: 0.03, score: 25 },
        { value: 0.07, score: 50 },
        { value: 0.12, score: 75 },
        { value: 0.18, score: 100 },
      ],
    },
    "return-on-assets": {
      metricId: "return-on-assets",
      mode: "higher-is-better",
      anchors: [
        { value: 0, score: 0 },
        { value: 0.03, score: 25 },
        { value: 0.06, score: 50 },
        { value: 0.1, score: 75 },
        { value: 0.15, score: 100 },
      ],
    },
    "return-on-equity": {
      metricId: "return-on-equity",
      mode: "higher-is-better",
      anchors: [
        { value: 0, score: 0 },
        { value: 0.08, score: 25 },
        { value: 0.12, score: 50 },
        { value: 0.18, score: 75 },
        { value: 0.25, score: 100 },
      ],
    },
    "return-on-capital-employed": {
      metricId: "return-on-capital-employed",
      mode: "higher-is-better",
      anchors: [
        { value: 0, score: 0 },
        { value: 0.06, score: 25 },
        { value: 0.1, score: 50 },
        { value: 0.15, score: 75 },
        { value: 0.2, score: 100 },
      ],
    },
    "current-ratio": {
      metricId: "current-ratio",
      mode: "target-range",
      anchors: [
        { value: 0.5, score: 0 },
        { value: 0.8, score: 25 },
        { value: 1, score: 50 },
        { value: 1.5, score: 100 },
        { value: 2.5, score: 100 },
        { value: 3.5, score: 75 },
        { value: 5, score: 50 },
      ],
    },
    "quick-ratio": {
      metricId: "quick-ratio",
      mode: "target-range",
      anchors: [
        { value: 0.4, score: 0 },
        { value: 0.7, score: 25 },
        { value: 0.9, score: 50 },
        { value: 1, score: 100 },
        { value: 1.8, score: 100 },
        { value: 2.5, score: 75 },
        { value: 4, score: 50 },
      ],
    },
    "cash-ratio": {
      metricId: "cash-ratio",
      mode: "target-range",
      anchors: [
        { value: 0.05, score: 0 },
        { value: 0.1, score: 25 },
        { value: 0.2, score: 50 },
        { value: 0.3, score: 100 },
        { value: 0.8, score: 100 },
        { value: 1.2, score: 75 },
        { value: 2, score: 50 },
      ],
    },
    "operating-cash-flow-ratio": {
      metricId: "operating-cash-flow-ratio",
      mode: "higher-is-better",
      anchors: [
        { value: 0, score: 0 },
        { value: 0.2, score: 25 },
        { value: 0.5, score: 50 },
        { value: 0.8, score: 75 },
        { value: 1.2, score: 100 },
      ],
    },
    "debt-to-equity": {
      metricId: "debt-to-equity",
      mode: "lower-is-better",
      anchors: [
        { value: 0.5, score: 100 },
        { value: 1, score: 75 },
        { value: 1.5, score: 50 },
        { value: 2, score: 25 },
        { value: 3, score: 0 },
      ],
    },
    "debt-to-assets": {
      metricId: "debt-to-assets",
      mode: "lower-is-better",
      anchors: [
        { value: 0.2, score: 100 },
        { value: 0.35, score: 75 },
        { value: 0.5, score: 50 },
        { value: 0.6, score: 25 },
        { value: 0.7, score: 0 },
      ],
    },
    "equity-ratio": {
      metricId: "equity-ratio",
      mode: "higher-is-better",
      anchors: [
        { value: 0.15, score: 0 },
        { value: 0.25, score: 25 },
        { value: 0.35, score: 50 },
        { value: 0.5, score: 75 },
        { value: 0.65, score: 100 },
      ],
    },
    "interest-coverage": {
      metricId: "interest-coverage",
      mode: "higher-is-better",
      anchors: [
        { value: 1, score: 0 },
        { value: 1.5, score: 25 },
        { value: 3, score: 50 },
        { value: 5, score: 75 },
        { value: 8, score: 100 },
      ],
    },
    "asset-turnover": {
      metricId: "asset-turnover",
      mode: "higher-is-better",
      anchors: [
        { value: 0.25, score: 0 },
        { value: 0.5, score: 25 },
        { value: 0.8, score: 50 },
        { value: 1.2, score: 75 },
        { value: 1.8, score: 100 },
      ],
    },
    "days-sales-outstanding": {
      metricId: "days-sales-outstanding",
      mode: "lower-is-better",
      anchors: [
        { value: 30, score: 100 },
        { value: 45, score: 75 },
        { value: 60, score: 50 },
        { value: 90, score: 25 },
        { value: 120, score: 0 },
      ],
    },
    "days-inventory-outstanding": {
      metricId: "days-inventory-outstanding",
      mode: "lower-is-better",
      anchors: [
        { value: 30, score: 100 },
        { value: 60, score: 75 },
        { value: 90, score: 50 },
        { value: 120, score: 25 },
        { value: 180, score: 0 },
      ],
    },
    "cash-conversion-cycle": {
      metricId: "cash-conversion-cycle",
      mode: "lower-is-better",
      anchors: [
        { value: 30, score: 100 },
        { value: 60, score: 75 },
        { value: 90, score: 50 },
        { value: 120, score: 25 },
        { value: 180, score: 0 },
      ],
    },
    "operating-cash-flow-margin": {
      metricId: "operating-cash-flow-margin",
      mode: "higher-is-better",
      anchors: [
        { value: 0, score: 0 },
        { value: 0.05, score: 25 },
        { value: 0.1, score: 50 },
        { value: 0.15, score: 75 },
        { value: 0.2, score: 100 },
      ],
    },
    "free-cash-flow-margin": {
      metricId: "free-cash-flow-margin",
      mode: "higher-is-better",
      anchors: [
        { value: 0, score: 0 },
        { value: 0.03, score: 25 },
        { value: 0.07, score: 50 },
        { value: 0.12, score: 75 },
        { value: 0.18, score: 100 },
      ],
    },
    "operating-cash-flow-to-net-income": {
      metricId: "operating-cash-flow-to-net-income",
      mode: "target-range",
      anchors: [
        { value: 0, score: 0 },
        { value: 0.5, score: 25 },
        { value: 0.8, score: 50 },
        { value: 1, score: 100 },
        { value: 1.5, score: 100 },
        { value: 2, score: 75 },
        { value: 3, score: 50 },
        { value: 4, score: 25 },
      ],
    },
  },
  minimumDimensionCoverage: 0.6,
  minimumDimensionMetricCount: 2,
  minimumTotalCoverage: 0.7,
  minimumAvailableDimensionCount: 4,
};
