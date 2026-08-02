import type { EChartsCoreOption } from "echarts/core";

import { chartTheme, baseTooltip } from "@/features/executive-dashboard/charts/chart-theme";
import type {
  DashboardDimensionRadarViewModel,
  DashboardHealthTrendViewModel,
  DashboardProfitabilityWaterfallViewModel,
  DashboardRatioTrendMetricViewModel,
  DashboardScoreContributionViewModel,
} from "@/features/executive-dashboard/types/dashboard.types";

function animation(reducedMotion: boolean) {
  return !reducedMotion;
}

function chartValue(value: number | null) {
  return value === null ? null : value;
}

function waterfallChartData(waterfall: DashboardProfitabilityWaterfallViewModel) {
  let balance = 0;

  return waterfall.steps.map((step) => {
    const movement = step.rawValue ?? 0;
    const isSubtotal = step.kind === "subtotal" || step.kind === "total";
    const resultingBalance = isSubtotal ? movement : balance + movement;
    const base = isSubtotal ? 0 : Math.min(balance, resultingBalance);
    const value = Math.abs(isSubtotal ? resultingBalance : movement);
    const color =
      step.kind === "subtotal" || step.kind === "total"
        ? chartTheme.colors.current
        : step.kind === "bridge"
          ? chartTheme.colors.warning
          : movement < 0
            ? chartTheme.colors.negative
            : chartTheme.colors.positive;

    balance = resultingBalance;

    return {
      base,
      value,
      movement,
      resultingBalance,
      label: step.label,
      displayValue: step.value.display,
      color,
    };
  });
}

export function buildDimensionRadarOption(
  radar: DashboardDimensionRadarViewModel,
  reducedMotion = false
): EChartsCoreOption {
  return {
    animation: animation(reducedMotion),
    backgroundColor: chartTheme.colors.background,
    color: [chartTheme.colors.current, chartTheme.colors.previous],
    tooltip: baseTooltip(),
    legend: {
      bottom: 0,
      textStyle: { color: chartTheme.colors.text, fontFamily: chartTheme.fontFamily },
      itemWidth: 10,
      itemHeight: 10,
    },
    radar: {
      radius: "68%",
      indicator: radar.indicators.map((indicator) => ({ name: indicator.label, max: indicator.max })),
      axisName: { color: chartTheme.colors.text, fontFamily: chartTheme.fontFamily, fontSize: 11 },
      splitLine: { lineStyle: { color: chartTheme.colors.grid } },
      splitArea: { areaStyle: { color: ["rgba(15, 23, 42, 0.18)", "rgba(30, 41, 59, 0.22)"] } },
      axisLine: { lineStyle: { color: chartTheme.colors.axis } },
    },
    series: [
      {
        type: "radar",
        data: [
          { name: `Current period ${radar.current.year}`, value: radar.current.values.map(chartValue) },
          ...(radar.previous
            ? [{ name: `Previous period ${radar.previous.year}`, value: radar.previous.values.map(chartValue) }]
            : []),
        ],
        areaStyle: { opacity: 0.1 },
        lineStyle: { width: 2 },
        symbolSize: 4,
      },
    ],
  };
}

export function buildHealthTrendOption(trend: DashboardHealthTrendViewModel, reducedMotion = false): EChartsCoreOption {
  return {
    animation: animation(reducedMotion),
    backgroundColor: chartTheme.colors.background,
    color: [chartTheme.colors.current],
    tooltip: baseTooltip(),
    grid: { left: 36, right: 18, top: 28, bottom: 34 },
    xAxis: {
      type: "category",
      data: trend.points.map((point) => point.year),
      axisLabel: { color: chartTheme.colors.text, fontFamily: chartTheme.monoFontFamily },
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
        name: "Financial Health Score",
        type: "line",
        connectNulls: false,
        smooth: false,
        symbolSize: 7,
        data: trend.points.map((point) => chartValue(point.value)),
        lineStyle: { width: 3 },
        areaStyle: { opacity: 0.06 },
      },
    ],
  };
}

export function buildRatioTrendOption(metric: DashboardRatioTrendMetricViewModel, reducedMotion = false): EChartsCoreOption {
  return {
    animation: animation(reducedMotion),
    backgroundColor: chartTheme.colors.background,
    color: [chartTheme.colors.current],
    tooltip: baseTooltip(),
    grid: { left: 42, right: 18, top: 28, bottom: 34 },
    xAxis: {
      type: "category",
      data: metric.points.map((point) => point.year),
      axisLabel: { color: chartTheme.colors.text, fontFamily: chartTheme.monoFontFamily },
      axisLine: { lineStyle: { color: chartTheme.colors.axis } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: chartTheme.colors.text, fontFamily: chartTheme.monoFontFamily },
      splitLine: { lineStyle: { color: chartTheme.colors.grid } },
    },
    series: [
      {
        name: metric.label,
        type: "line",
        connectNulls: false,
        smooth: false,
        symbolSize: 7,
        data: metric.points.map((point) => chartValue(point.value)),
        lineStyle: { width: 3 },
      },
    ],
  };
}

export function buildProfitabilityWaterfallOption(
  waterfall: DashboardProfitabilityWaterfallViewModel,
  reducedMotion = false
): EChartsCoreOption {
  const data = waterfallChartData(waterfall);

  return {
    animation: animation(reducedMotion),
    backgroundColor: chartTheme.colors.background,
    color: [chartTheme.colors.current],
    tooltip: {
      ...baseTooltip(),
      trigger: "axis",
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? params : [params];
        const valueItem = items.find((item) => {
          return typeof item === "object" && item !== null && "seriesName" in item && item.seriesName === "Profitability bridge";
        }) as { name?: string; data?: { displayValue?: string; movement?: number; resultingBalance?: number } } | undefined;
        const itemData = valueItem?.data;
        const movement = itemData?.movement ?? 0;
        const movementPrefix = movement > 0 ? "+" : "";
        const balance = itemData?.resultingBalance;

        return [
          `<strong>${valueItem?.name ?? "Profitability bridge"}</strong>`,
          `Step movement: ${itemData?.displayValue ?? `${movementPrefix}${movement}`}`,
          typeof balance === "number" ? `Resulting balance: ${balance}` : "",
        ]
          .filter(Boolean)
          .join("<br/>");
      },
    },
    grid: { left: 44, right: 18, top: 24, bottom: 58 },
    xAxis: {
      type: "category",
      data: waterfall.steps.map((step) => step.label),
      axisLabel: { color: chartTheme.colors.text, fontFamily: chartTheme.fontFamily, interval: 0, rotate: 20 },
      axisLine: { lineStyle: { color: chartTheme.colors.axis } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: chartTheme.colors.text, fontFamily: chartTheme.monoFontFamily },
      splitLine: { lineStyle: { color: chartTheme.colors.grid } },
    },
    series: [
      {
        name: "Waterfall base",
        type: "bar",
        stack: "profitability-waterfall",
        data: data.map((item) => item.base),
        itemStyle: { color: "transparent" },
        emphasis: { disabled: true },
        silent: true,
      },
      {
        name: "Profitability bridge",
        type: "bar",
        stack: "profitability-waterfall",
        data: data.map((item) => ({
          value: item.value,
          movement: item.movement,
          resultingBalance: item.resultingBalance,
          displayValue: item.displayValue,
          itemStyle: { color: item.color },
        })),
        barMaxWidth: 34,
      },
    ],
  };
}

export function buildScoreContributionOption(
  scoreContribution: DashboardScoreContributionViewModel,
  reducedMotion = false
): EChartsCoreOption {
  return {
    animation: animation(reducedMotion),
    backgroundColor: chartTheme.colors.background,
    color: [chartTheme.colors.current],
    tooltip: baseTooltip(),
    grid: { left: 42, right: 18, top: 22, bottom: 52 },
    xAxis: {
      type: "category",
      data: scoreContribution.dimensions.map((dimension) => dimension.label),
      axisLabel: { color: chartTheme.colors.text, fontFamily: chartTheme.fontFamily, interval: 0, rotate: 24 },
      axisLine: { lineStyle: { color: chartTheme.colors.axis } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: chartTheme.colors.text, fontFamily: chartTheme.monoFontFamily },
      splitLine: { lineStyle: { color: chartTheme.colors.grid } },
    },
    series: [
      {
        name: "Score contribution",
        type: "bar",
        data: scoreContribution.dimensions.map((dimension) => chartValue(dimension.contribution)),
        barMaxWidth: 34,
      },
    ],
  };
}
