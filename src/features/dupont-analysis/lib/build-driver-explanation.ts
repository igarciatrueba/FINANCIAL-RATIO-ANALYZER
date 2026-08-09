import type { DupontAnalysisViewModel, DupontAttributionContributionViewModel, DupontFactorViewModel } from "@/features/dupont-analysis/types/dupont.types";

function factorPhrase(contribution: DupontAttributionContributionViewModel | null) {
  if (!contribution) {
    return "no single factor";
  }

  if (contribution.factorId === "netProfitMargin") {
    return contribution.rawValue >= 0 ? "stronger net profit margin" : "weaker net profit margin";
  }

  if (contribution.factorId === "assetTurnover") {
    return contribution.rawValue >= 0 ? "stronger asset efficiency" : "weaker asset efficiency";
  }

  return contribution.rawValue >= 0 ? "higher financial leverage" : "lower financial leverage";
}

function movementPhrase(rawChange: number | null) {
  if (rawChange === null) {
    return "ROE movement is unavailable";
  }

  if (rawChange >= 0.005) {
    return "ROE improved";
  }

  if (rawChange <= -0.005) {
    return "ROE deteriorated";
  }

  return "ROE was broadly stable";
}

function operatingContext(factors: DupontFactorViewModel[]) {
  const margin = factors.find((factor) => factor.id === "netProfitMargin");
  const turnover = factors.find((factor) => factor.id === "assetTurnover");
  const marginChange = margin?.rawChange;
  const turnoverChange = turnover?.rawChange;

  if (marginChange === null || marginChange === undefined || turnoverChange === null || turnoverChange === undefined) {
    return "Operating movement cannot be fully assessed because at least one operating factor is unavailable.";
  }

  if (marginChange >= 0 && turnoverChange >= 0) {
    return "Operating performance improved through margin and asset-efficiency support.";
  }

  if (marginChange < 0 && turnoverChange < 0) {
    return "Operating performance weakened through both margin pressure and lower asset efficiency.";
  }

  if (marginChange < 0) {
    return "Asset efficiency partially offsets weaker net profit margin.";
  }

  return "Improved net profit margin partially offsets weaker asset efficiency.";
}

export function buildDriverExplanation(viewModel: Pick<DupontAnalysisViewModel, "attribution" | "factorComparison" | "overview">) {
  const movement = movementPhrase(viewModel.overview.rawChange);
  const primary = viewModel.attribution.primaryDriver;
  const primaryPhrase = factorPhrase(primary);
  const operating = operatingContext(viewModel.factorComparison);
  const leverage = viewModel.factorComparison.find((factor) => factor.id === "financialLeverage");
  const leverageChange = leverage?.rawChange;

  let leverageSentence = "Financial leverage is interpreted in context rather than treated as automatically favourable.";
  if (leverage?.rawCurrent !== null && leverage?.rawCurrent !== undefined && leverage.rawCurrent >= 3) {
    leverageSentence = "Current ROE has material financial leverage support, increasing financial dependence.";
  } else if (leverageChange !== null && leverageChange !== undefined && leverageChange > 0) {
    leverageSentence = "Higher leverage supports reported ROE but increases financial dependence.";
  } else if (leverageChange !== null && leverageChange !== undefined && leverageChange < 0) {
    leverageSentence = "Lower leverage can reduce ROE mechanically while improving resilience.";
  }

  return {
    headline: primary ? `${movement}; primary driver: ${primary.label}` : `${movement}; no dominant driver`,
    text: `${movement}. The change is primarily associated with ${primaryPhrase}. ${operating} ${leverageSentence}`,
    operatingContext: operating,
    leverageContext: leverageSentence,
  };
}
