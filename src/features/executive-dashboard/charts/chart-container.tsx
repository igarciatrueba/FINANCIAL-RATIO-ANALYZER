"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { BarChart, LineChart, RadarChart } from "echarts/charts";
import { GridComponent, LegendComponent, RadarComponent, TooltipComponent } from "echarts/components";
import { init, use as registerEChartsModules, type EChartsCoreOption, type EChartsType } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";

registerEChartsModules([BarChart, LineChart, RadarChart, GridComponent, LegendComponent, RadarComponent, TooltipComponent, SVGRenderer]);

type ChartContainerProps = {
  accessibleName: string;
  accessibleDescription: string;
  option: EChartsCoreOption;
  summary: ReactNode;
  heightClassName?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
};

export function useReducedMotionPreference() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window.matchMedia !== "function") {
        return () => {};
      }

      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    () => (typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false),
    () => false
  );
}

export function ChartContainer({
  accessibleName,
  accessibleDescription,
  option,
  summary,
  heightClassName = "h-64",
  isEmpty = false,
  emptyMessage = "No chart data is available.",
}: ChartContainerProps) {
  const chartRef = useRef<EChartsType | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const descriptionId = useId();

  useEffect(() => {
    let cancelled = false;

    if (isEmpty) {
      return undefined;
    }

    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    try {
      const chart = init(container, undefined, { renderer: "svg" });
      chartRef.current = chart;
      chart.setOption(option, true);
      queueMicrotask(() => {
        if (!cancelled) {
          setStatus("ready");
        }
      });

      const observer =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(() => {
              chart.resize();
            });
      observer?.observe(container);

      return () => {
        cancelled = true;
        observer?.disconnect();
        chart.dispose();
        chartRef.current = null;
      };
    } catch {
      queueMicrotask(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });
      return undefined;
    }
  }, [isEmpty, option]);

  return (
    <div className="rounded-md border border-border bg-surface p-4 md:p-5">
      <div>
        <p className="text-caption uppercase text-neutral-400">Visual analysis</p>
        <h2 className="mt-1 text-h4 font-semibold text-neutral-50">{accessibleName}</h2>
        <p className="mt-1 text-caption text-neutral-400" id={descriptionId}>
          {accessibleDescription}
        </p>
      </div>

      {isEmpty ? (
        <div className={`${heightClassName} mt-3 flex items-center justify-center rounded-sm border border-dashed border-border bg-background/30 p-4`}>
          <p className="text-center text-small text-neutral-300">{emptyMessage}</p>
        </div>
      ) : (
        <div className="relative mt-3">
          {status === "loading" ? (
            <p className="absolute inset-x-0 top-0 text-caption text-neutral-400" role="status">
              Loading chart
            </p>
          ) : null}
          {status === "error" ? (
            <p className="rounded-sm border border-danger/40 bg-danger/10 p-3 text-small text-neutral-100" role="alert">
              Chart could not be rendered.
            </p>
          ) : null}
          <div
            aria-describedby={descriptionId}
            aria-label={accessibleName}
            className={`min-w-0 ${heightClassName}`}
            ref={containerRef}
            role="img"
          />
        </div>
      )}

      <div className="mt-3">{summary}</div>
    </div>
  );
}
