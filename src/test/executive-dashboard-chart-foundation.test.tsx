import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { disposeMock, initMock, resizeMock, setOptionMock, useMock } = vi.hoisted(() => ({
  disposeMock: vi.fn(),
  initMock: vi.fn(),
  resizeMock: vi.fn(),
  setOptionMock: vi.fn(),
  useMock: vi.fn(),
}));

vi.mock("echarts/core", () => ({
  init: initMock,
  use: useMock,
}));

vi.mock("echarts/charts", () => ({
  BarChart: {},
  LineChart: {},
  RadarChart: {},
}));

vi.mock("echarts/components", () => ({
  GridComponent: {},
  LegendComponent: {},
  RadarComponent: {},
  TooltipComponent: {},
}));

vi.mock("echarts/renderers", () => ({
  SVGRenderer: {},
}));

class TestResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe() {
    this.callback([], this);
  }

  disconnect() {}

  unobserve() {}
}

describe("Phase 6 Delivery 2 ECharts foundation", () => {
  let ChartContainer: typeof import("@/features/executive-dashboard/charts/chart-container").ChartContainer;

  beforeEach(async () => {
    vi.resetModules();
    ({ ChartContainer } = await import("@/features/executive-dashboard/charts/chart-container"));
    initMock.mockReturnValue({ dispose: disposeMock, resize: resizeMock, setOption: setOptionMock });
    Object.defineProperty(window, "ResizeObserver", {
      configurable: true,
      value: TestResizeObserver,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders an SSR-safe accessible chart shell without browser APIs", () => {
    const html = renderToString(
      <ChartContainer
        accessibleDescription="Financial Health Score across reporting periods."
        accessibleName="Financial health trend"
        option={{ series: [] }}
        summary={<p>Score trend summary</p>}
      />
    );

    expect(html).toContain("Financial health trend");
    expect(html).toContain("Score trend summary");
  });

  it("initialises modular ECharts once, resizes and disposes on unmount", async () => {
    const { unmount } = render(
      <ChartContainer
        accessibleDescription="Dimension comparison."
        accessibleName="Financial dimension radar"
        option={{ series: [] }}
        summary={<p>Radar summary</p>}
      />
    );

    await waitFor(() => expect(initMock).toHaveBeenCalledTimes(1));
    expect(useMock).toHaveBeenCalled();
    expect(setOptionMock).toHaveBeenCalledWith({ series: [] }, true);
    expect(resizeMock).toHaveBeenCalled();

    unmount();

    expect(disposeMock).toHaveBeenCalledTimes(1);
  });

  it("shows an explicit empty state without initialising ECharts", () => {
    render(
      <ChartContainer
        accessibleDescription="Unavailable chart."
        accessibleName="Unavailable chart"
        emptyMessage="No defensible chart data is available."
        isEmpty
        option={{ series: [] }}
        summary={<p>No values</p>}
      />
    );

    expect(screen.getByText("No defensible chart data is available.")).toBeInTheDocument();
    expect(initMock).not.toHaveBeenCalled();
  });
});
