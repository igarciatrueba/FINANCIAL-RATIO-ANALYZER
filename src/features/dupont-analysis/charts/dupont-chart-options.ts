import type { EChartsCoreOption } from "echarts/core";

import { baseTooltip, chartTheme } from "@/features/executive-dashboard/charts/chart-theme";
import type { DupontAttributionViewModel, DupontFactorTrendViewModel } from "@/features/dupont-analysis/types/dupont.types";

export function buildDupontAttributionOption(attribution: DupontAttributionViewModel): EChartsCoreOption {
  if (attribution.status === "unavailable") {
    return {
      backgroundColor: chartTheme.colors.background,
      xAxis: { type: "category", data: [] },
      yAxis: { type: "value" },
      series: [{ name: "ROE contribution", type: "bar", data: [] }],
    };
  }

  let balance = 0;
  const data = attribution.contributions.map((contribution) => {
    const next = balance + contribution.rawValue;
    const base = Math.min(balance, next);
    const value = Math.abs(contribution.rawValue);
    balance = next;

    return {
      label: contribution.label,
      base,
      value,
      contribution: contribution.value.display,
      balance,
      color:
        contribution.direction === "positive"
          ? chartTheme.colors.positive
          : contribution.direction === "negative"
            ? chartTheme.colors.negative
            : chartTheme.colors.neutral,
    };
  });

  return {
    backgroundColor: chartTheme.colors.background,
    animationDuration: 500,
    tooltip: {
      ...baseTooltip(),
      trigger: "axis",
      formatter: (params: unknown) => {
        const values = Array.isArray(params) ? params : [params];
        const visible = values.find((item) => typeof item === "object" && item !== null && "data" in item) as
          | { name?: string; data?: { contribution?: string; balance?: number } }
          | undefined;
        const balanceDisplay =
          typeof visible?.data?.balance === "number" ? `${(visible.data.balance * 100).toFixed(2)} pp` : "Unavailable";
        return `<strong>${visible?.name ?? "Contribution"}</strong><br/>Contribution: ${
          visible?.data?.contribution ?? "Unavailable"
        }<br/>Cumulative ROE change: ${balanceDisplay}`;
      },
    },
    grid: { left: 44, right: 16, top: 24, bottom: 36 },
    xAxis: {
      type: "category",
      data: data.map((item) => item.label),
      axisLabel: { color: chartTheme.colors.mutedText, fontFamily: chartTheme.fontFamily },
      axisLine: { lineStyle: { color: chartTheme.colors.axis } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: chartTheme.colors.mutedText,
        formatter: (value: number) => `${(value * 100).toFixed(0)}pp`,
      },
      splitLine: { lineStyle: { color: chartTheme.colors.grid } },
    },
    series: [
      {
        name: "Contribution base",
        type: "bar",
        stack: "roe-attribution",
        data: data.map((item) => item.base),
        itemStyle: { color: "transparent" },
        emphasis: { disabled: true },
        silent: true,
      },
      {
        name: "ROE contribution",
        type: "bar",
        stack: "roe-attribution",
        barMaxWidth: 38,
        data: data.map((item) => ({
          value: item.value,
          contribution: item.contribution,
          balance: item.balance,
          itemStyle: { color: item.color },
        })),
      },
    ],
  };
}

export function buildDupontFactorTrendOption(trends: DupontFactorTrendViewModel): EChartsCoreOption {
  return {
    backgroundColor: chartTheme.colors.background,
    animationDuration: 500,
    tooltip: {
      ...baseTooltip(),
      trigger: "axis",
    },
    legend: {
      top: 0,
      textStyle: { color: chartTheme.colors.mutedText, fontFamily: chartTheme.fontFamily },
    },
    grid: { left: 44, right: 18, top: 42, bottom: 34 },
    xAxis: {
      type: "category",
      data: trends.years,
      axisLabel: { color: chartTheme.colors.mutedText, fontFamily: chartTheme.fontFamily },
      axisLine: { lineStyle: { color: chartTheme.colors.axis } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      name: "Indexed",
      min: 0,
      axisLabel: { color: chartTheme.colors.mutedText, formatter: "{value}" },
      splitLine: { lineStyle: { color: chartTheme.colors.grid } },
    },
    series: trends.series.map((series, index) => {
      const colors = [chartTheme.colors.current, chartTheme.colors.positive, chartTheme.colors.warning, chartTheme.colors.previous];

      return {
        name: series.label,
        type: "line",
        connectNulls: false,
        symbol: "circle",
        data: series.indexedPoints.map((point) => point.indexedValue),
        lineStyle: { color: colors[index] ?? chartTheme.colors.neutral, width: 2 },
        itemStyle: { color: colors[index] ?? chartTheme.colors.neutral },
      };
    }),
  };
}
