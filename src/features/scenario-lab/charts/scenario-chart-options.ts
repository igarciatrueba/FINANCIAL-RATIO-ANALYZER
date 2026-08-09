import type { EChartsCoreOption } from "echarts/core";

import { chartTheme, baseTooltip } from "@/features/executive-dashboard/charts/chart-theme";
import type { ScenarioDimensionChartViewModel } from "@/features/scenario-lab/types/scenario.types";

function chartValue(value: number | null) {
  return value === null ? null : value;
}

export function buildScenarioDimensionComparisonOption(
  chart: ScenarioDimensionChartViewModel,
  reducedMotion = false
): EChartsCoreOption {
  return {
    animation: !reducedMotion,
    backgroundColor: chartTheme.colors.background,
    color: [chartTheme.colors.previous, chartTheme.colors.current],
    tooltip: baseTooltip(),
    legend: {
      bottom: 0,
      textStyle: { color: chartTheme.colors.text, fontFamily: chartTheme.fontFamily },
      itemWidth: 10,
      itemHeight: 10,
    },
    grid: { left: 34, right: 18, top: 24, bottom: 58 },
    xAxis: {
      type: "category",
      data: chart.categories,
      axisLabel: { color: chartTheme.colors.text, fontFamily: chartTheme.fontFamily, interval: 0, rotate: 20 },
      axisLine: { lineStyle: { color: chartTheme.colors.axis } },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { color: chartTheme.colors.text, fontFamily: chartTheme.monoFontFamily },
      splitLine: { lineStyle: { color: chartTheme.colors.grid } },
    },
    series: [
      {
        name: "Base Case",
        type: "bar",
        data: chart.baseValues.map(chartValue),
        barMaxWidth: 22,
      },
      {
        name: "Scenario Case",
        type: "bar",
        data: chart.scenarioValues.map(chartValue),
        barMaxWidth: 22,
      },
    ],
  };
}
