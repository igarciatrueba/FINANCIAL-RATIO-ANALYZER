import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ACTIVE_ANALYSIS_STORAGE_KEY,
  buildActiveAnalysisSession,
  serializeActiveAnalysisSession,
} from "@/features/financial-input/persistence";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { ScenarioSessionBoundary } from "@/features/scenario-lab/components/scenario-session-boundary";

const { analyseFinancialStatementsMock } = vi.hoisted(() => ({
  analyseFinancialStatementsMock: vi.fn(),
}));

vi.mock("@/domain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domain")>();
  analyseFinancialStatementsMock.mockImplementation(actual.analyseFinancialStatements);

  return {
    ...actual,
    analyseFinancialStatements: analyseFinancialStatementsMock,
  };
});

vi.mock("@/features/executive-dashboard/charts/chart-container", () => ({
  ChartContainer: ({
    accessibleDescription,
    accessibleName,
    emptyMessage,
    isEmpty,
    summary,
  }: {
    accessibleDescription: string;
    accessibleName: string;
    emptyMessage?: string;
    isEmpty?: boolean;
    summary: ReactNode;
  }) => (
    <div aria-label={accessibleName} role="img">
      <p>{accessibleDescription}</p>
      {isEmpty ? <p>{emptyMessage}</p> : <div data-testid={`chart-${accessibleName}`} />}
      {summary}
    </div>
  ),
  useReducedMotionPreference: () => false,
}));

function storeDemoSession(id: "novatech-solutions" | "atlas-manufacturing-group") {
  window.sessionStorage.setItem(
    ACTIVE_ANALYSIS_STORAGE_KEY,
    serializeActiveAnalysisSession(buildActiveAnalysisSession(cloneDemoCompany(id)))
  );
}

describe("Phase 8 Scenario Lab session integration", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    analyseFinancialStatementsMock.mockClear();
  });

  it("renders compact Base Case context with an inactive state and no Calculate button", async () => {
    storeDemoSession("novatech-solutions");

    render(<ScenarioSessionBoundary />);

    expect(screen.getByRole("status")).toHaveTextContent(/preparing scenario lab/i);
    expect(await screen.findByText("NovaTech Solutions")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("EUR")).toBeInTheDocument();
    expect(screen.getByText("Base Case → Scenario Case")).toBeInTheDocument();
    expect(screen.getByText("Base Case active")).toBeInTheDocument();
    expect(screen.getByText(/Choose a preset or modify an assumption to compare a transformed Scenario Case/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /calculate/i })).not.toBeInTheDocument();
    const baseCaseReference = screen.getByRole("button", { name: /view base case analytical reference/i }).closest("details");
    expect(baseCaseReference).not.toHaveAttribute("open");
  });

  it("selects presets, recalculates immediately, and switches to Custom after manual edits", async () => {
    const user = userEvent.setup();
    storeDemoSession("novatech-solutions");

    render(<ScenarioSessionBoundary />);

    await screen.findByText("NovaTech Solutions");
    await user.selectOptions(screen.getByLabelText(/preset scenario/i), "highGrowth");

    expect(screen.getByText("Selected scenario")).toBeInTheDocument();
    expect(screen.getAllByText("High Growth").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Revenue growth: \+15%/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/EBIT margin target: 28%/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/operating sensitivity, not a complete income-statement forecast/i)).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: /revenue growth/i })).toHaveValue(15);

    await user.clear(screen.getByRole("spinbutton", { name: /revenue growth/i }));
    await user.type(screen.getByRole("spinbutton", { name: /revenue growth/i }), "12");

    expect(screen.getAllByText("Custom").length).toBeGreaterThan(0);
    expect(screen.getByRole("status", { name: /scenario validation status/i })).toHaveTextContent(/scenario recalculated/i);
    expect(screen.getByText("Custom scenario")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /health score impact/i })).toBeInTheDocument();
  });

  it("keeps each premium range control synchronized with its keyboard-editable numeric assumption", async () => {
    const user = userEvent.setup();
    storeDemoSession("novatech-solutions");

    render(<ScenarioSessionBoundary />);

    await screen.findByText("NovaTech Solutions");
    const numeric = screen.getByRole("spinbutton", { name: /^revenue growth$/i });
    const range = screen.getByRole("slider", { name: /adjust revenue growth scenario assumption/i });

    expect(range).toHaveAttribute("type", "range");
    await user.clear(numeric);
    await user.type(numeric, "15");
    expect(range).toHaveValue("15");

    fireEvent.change(range, { target: { value: "16" } });
    expect(numeric).toHaveValue(16);
  });

  it("returns to the inactive Base Case state after a manual assumption is restored", async () => {
    const user = userEvent.setup();
    storeDemoSession("novatech-solutions");

    render(<ScenarioSessionBoundary />);

    await screen.findByText("NovaTech Solutions");
    await user.clear(screen.getByRole("spinbutton", { name: /total debt/i }));
    await user.type(screen.getByRole("spinbutton", { name: /total debt/i }), "-19");
    expect(screen.getByText("Custom scenario")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /health score impact/i })).toBeInTheDocument();

    await user.clear(screen.getByRole("spinbutton", { name: /total debt/i }));
    await user.type(screen.getByRole("spinbutton", { name: /total debt/i }), "0");

    expect(screen.getByText("Base Case active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view base case analytical reference/i }).closest("details")).not.toHaveAttribute("open");
  });

  it("resets to the exact Base Case score and assumptions", async () => {
    const user = userEvent.setup();
    storeDemoSession("atlas-manufacturing-group");

    render(<ScenarioSessionBoundary />);

    await screen.findByText("Atlas Manufacturing Group");
    expect(screen.getByText("Base Case active")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/preset scenario/i), "debtReduction");
    const impact = screen.getByRole("region", { name: /health score impact/i });
    expect(impact).toHaveTextContent(/Scenario Case/);
    await user.click(screen.getByRole("button", { name: /reset to base case/i }));

    expect(screen.getByLabelText(/preset scenario/i)).toHaveValue("base");
    expect(screen.getByRole("spinbutton", { name: /revenue growth/i })).toHaveValue(0);
    expect(screen.getByRole("spinbutton", { name: /total debt/i })).toHaveValue(0);
    expect(screen.getByText("Base Case active")).toBeInTheDocument();
  });

  it("shows invalid scenario errors safely without stale scenario comparison claims", async () => {
    const user = userEvent.setup();
    storeDemoSession("atlas-manufacturing-group");

    render(<ScenarioSessionBoundary />);

    await screen.findByText("Atlas Manufacturing Group");
    await user.clear(screen.getByRole("spinbutton", { name: /current assets/i }));
    await user.type(screen.getByRole("spinbutton", { name: /current assets/i }), "-80");
    await user.clear(screen.getByRole("spinbutton", { name: /^inventory/i }));
    await user.type(screen.getByRole("spinbutton", { name: /^inventory/i }), "20");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/inventory cannot exceed current assets/i);
    expect(screen.getByRole("status", { name: /scenario validation status/i })).toHaveTextContent(/scenario has validation issues/i);
  });

  it("renders key metric, insight and DuPont comparisons with user-facing labels", async () => {
    storeDemoSession("atlas-manufacturing-group");

    render(<ScenarioSessionBoundary />);

    expect(await screen.findByText("Atlas Manufacturing Group")).toBeInTheDocument();
    const metrics = screen.getByRole("region", { name: /key metric comparison/i });
    expect(within(metrics).getByText("Interest Coverage")).toBeInTheDocument();
    expect(within(metrics).getByText("Free Cash Flow")).toBeInTheDocument();
    expect(within(metrics).getByText("Cash Conversion Cycle")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /updated scenario insights/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /dupont scenario comparison/i })).toHaveTextContent(/Net Profit Margin/);
    expect(screen.queryByText("interest-coverage")).not.toBeInTheDocument();
    expect(screen.queryByText("free-cash-flow")).not.toBeInTheDocument();
  });

  it("shows distinct empty, corrupt, invalid and analysis-failure states", async () => {
    render(<ScenarioSessionBoundary />);
    expect(await screen.findByRole("heading", { name: /financial statements are required/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to financial input/i })).toHaveAttribute("href", "/input");

    cleanup();
    window.sessionStorage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, "{not json");
    render(<ScenarioSessionBoundary />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/scenario lab session could not be read/i);

    cleanup();
    window.sessionStorage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, savedAt: "now", data: {} }));
    render(<ScenarioSessionBoundary />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/failed canonical validation/i);

    cleanup();
    storeDemoSession("novatech-solutions");
    analyseFinancialStatementsMock.mockImplementationOnce(() => {
      throw new Error("forced base analysis failure");
    });
    render(<ScenarioSessionBoundary />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/base case could not be analysed/i);
    expect(screen.queryByText("NovaTech Solutions")).not.toBeInTheDocument();
  });

  it("provides required routes, methodology disclosure and 320px-safe structure", async () => {
    const user = userEvent.setup();
    const input = cloneDemoCompany("novatech-solutions");
    input.company.name = "NovaTech International Consolidated Financial Systems and Infrastructure Holdings";
    window.sessionStorage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, serializeActiveAnalysisSession(buildActiveAnalysisSession(input)));

    const { container } = render(<ScenarioSessionBoundary />);

    expect(await screen.findByText(input.company.name)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /executive dashboard/i })).toHaveAttribute("href", "/analysis");
    expect(screen.getByRole("link", { name: /dupont analysis/i })).toHaveAttribute("href", "/analysis/dupont");
    expect(screen.getByRole("link", { name: /edit financials/i })).toHaveAttribute("href", "/input");
    expect(screen.getByRole("link", { name: /methodology/i })).toHaveAttribute("href", "/methodology");
    expect(screen.getByRole("button", { name: /scenario assumptions and limitations/i })).toBeInTheDocument();
    expect(screen.getByText(/EBIT-margin targets are operating sensitivities, not complete income-statement forecasts/i)).toBeInTheDocument();
    expect(screen.getByText("Source: Latest-period Revenue")).toBeInTheDocument();
    expect(screen.getByText("Also affects: Cost of Goods Sold, EBIT and Net Income")).toBeInTheDocument();
    expect(screen.queryByText(/periods\[latest\]/i)).not.toBeInTheDocument();
    expect(container.querySelector(".truncate")).not.toBeInTheDocument();
    expect(container.querySelector('[class*="w-screen"]')).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole("link", { name: /executive dashboard/i })).toHaveFocus();
  });
});
