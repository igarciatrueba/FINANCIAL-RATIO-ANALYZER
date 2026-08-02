import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildActiveAnalysisSession, ACTIVE_ANALYSIS_STORAGE_KEY, serializeActiveAnalysisSession } from "@/features/financial-input/persistence";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { ExecutiveDashboardSessionBoundary } from "@/features/executive-dashboard/components/executive-dashboard-session-boundary";

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

describe("Phase 6 Delivery 1 executive dashboard integration", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    analyseFinancialStatementsMock.mockClear();
  });

  it("renders a valid NovaTech session as an executive dashboard", async () => {
    storeDemoSession("novatech-solutions");

    render(<ExecutiveDashboardSessionBoundary />);

    expect(screen.getByRole("status")).toHaveTextContent(/preparing local analysis/i);
    expect(await screen.findByText("NovaTech Solutions")).toBeInTheDocument();
    expect(screen.getByText("Enterprise Software")).toBeInTheDocument();
    expect(screen.getByText("2024 vs 2023")).toBeInTheDocument();
    expect(screen.getAllByText("EUR").length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/financial health score: 93.7 out of 100, strong/i)).toBeInTheDocument();
    expect(screen.getAllByText("Strong").length).toBeGreaterThan(0);
    expect(screen.getAllByText("100.0% coverage")[0]).toBeInTheDocument();
    expect(screen.getAllByText("EBIT margin is improving").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Working-capital cycle is deteriorating").length).toBeGreaterThan(0);
  });

  it("renders Atlas with critical score and principal risk insights", async () => {
    storeDemoSession("atlas-manufacturing-group");

    render(<ExecutiveDashboardSessionBoundary />);

    expect(await screen.findByText("Atlas Manufacturing Group")).toBeInTheDocument();
    expect(screen.getByLabelText(/financial health score: 31.4 out of 100, critical/i)).toBeInTheDocument();
    expect(screen.getAllByText("Critical").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Liquidity indicators are weak").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Free cash flow is negative").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Interest coverage is weak").length).toBeGreaterThan(0);
  });

  it("shows all six prioritised KPIs and all five financial dimensions", async () => {
    storeDemoSession("novatech-solutions");

    render(<ExecutiveDashboardSessionBoundary />);

    const kpiRegion = await screen.findByRole("region", { name: /kpi summary/i });
    expect(within(kpiRegion).getByText("Financial Health Score")).toBeInTheDocument();
    expect(within(kpiRegion).getByText("Return on Equity")).toBeInTheDocument();
    expect(within(kpiRegion).getByText("Current Ratio")).toBeInTheDocument();
    expect(within(kpiRegion).getByText("Debt-to-Equity")).toBeInTheDocument();
    expect(within(kpiRegion).getByText("Free Cash Flow")).toBeInTheDocument();
    expect(within(kpiRegion).getByText("Net Margin")).toBeInTheDocument();

    const dimensions = screen.getByRole("region", { name: /financial dimensions/i });
    expect(within(dimensions).getByText("Profitability")).toBeInTheDocument();
    expect(within(dimensions).getByText("Liquidity")).toBeInTheDocument();
    expect(within(dimensions).getByText("Solvency")).toBeInTheDocument();
    expect(within(dimensions).getByText("Efficiency")).toBeInTheDocument();
    expect(within(dimensions).getByText("Cash Flow")).toBeInTheDocument();
  });

  it("provides route actions back to input and methodology", async () => {
    const user = userEvent.setup();
    storeDemoSession("novatech-solutions");

    render(<ExecutiveDashboardSessionBoundary />);

    await screen.findByText("NovaTech Solutions");
    const editLink = screen.getByRole("link", { name: /edit financials/i });
    const methodologyLink = screen.getByRole("link", { name: /methodology/i });

    expect(editLink).toHaveAttribute("href", "/input");
    expect(methodologyLink).toHaveAttribute("href", "/methodology");

    await user.tab();
    await waitFor(() => expect(editLink).toHaveFocus());
  });

  it("shows a safe empty state when no active analysis session exists", async () => {
    render(<ExecutiveDashboardSessionBoundary />);

    expect(await screen.findByRole("heading", { name: /financial statements are required/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to financial input/i })).toHaveAttribute("href", "/input");
    expect(screen.getByRole("link", { name: /view methodology/i })).toHaveAttribute("href", "/methodology");
  });

  it("shows a safe error state for corrupt session data", async () => {
    window.sessionStorage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, "{not valid json");

    render(<ExecutiveDashboardSessionBoundary />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/analysis session could not be read/i);
    expect(screen.getByRole("link", { name: /return to financial input/i })).toHaveAttribute("href", "/input");
  });

  it("shows analysis failure without leaving stale or partial dashboard content visible", async () => {
    storeDemoSession("novatech-solutions");
    analyseFinancialStatementsMock.mockImplementationOnce(() => {
      throw new Error("forced analysis failure");
    });

    render(<ExecutiveDashboardSessionBoundary />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/analysis could not be completed/i);
    expect(alert).toHaveTextContent(/could not be analysed safely/i);
    expect(screen.getByRole("link", { name: /return to financial input/i })).toHaveAttribute("href", "/input");
    expect(screen.queryByRole("region", { name: /kpi summary/i })).not.toBeInTheDocument();
    expect(screen.queryByText("NovaTech Solutions")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/financial health score:/i)).not.toBeInTheDocument();
  });

  it("does not expose raw metric ids in visible insight evidence", async () => {
    storeDemoSession("atlas-manufacturing-group");

    render(<ExecutiveDashboardSessionBoundary />);

    await screen.findByText("Atlas Manufacturing Group");
    expect(screen.queryByText("current-ratio")).not.toBeInTheDocument();
    expect(screen.queryByText("free-cash-flow-margin")).not.toBeInTheDocument();
    expect(screen.getAllByText("Current Ratio").length).toBeGreaterThan(0);
  });

  it("keeps long company names and large currency values visible without destructive dashboard overflow classes", async () => {
    const input = cloneDemoCompany("novatech-solutions");
    input.company.name = "NovaTech International Consolidated Financial Systems and Infrastructure Holdings";
    input.periods[2].cashFlow.operatingCashFlow = 987654321;
    input.periods[2].cashFlow.capitalExpenditure = 123456789;
    window.sessionStorage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, serializeActiveAnalysisSession(buildActiveAnalysisSession(input)));

    const { container } = render(<ExecutiveDashboardSessionBoundary />);

    expect(await screen.findByText(input.company.name)).toBeInTheDocument();
    expect(screen.getAllByText("€864,197,532").length).toBeGreaterThan(0);
    expect(container.querySelector(".truncate")).not.toBeInTheDocument();
    expect(container.querySelector('[class*="w-screen"]')).not.toBeInTheDocument();
  });

  it("renders Delivery 2 analytical visuals and reporting sections from the active analysis", async () => {
    storeDemoSession("novatech-solutions");

    render(<ExecutiveDashboardSessionBoundary />);

    expect(await screen.findByRole("region", { name: /executive diagnosis/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /^executive summary$/i })).not.toBeInTheDocument();
    expect(screen.getByText("Key improvement")).toBeInTheDocument();
    expect(screen.getByText("Primary concern")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /financial dimension radar/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /financial health trend/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /selectable ratio trend/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /detailed ratio table/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /profitability waterfall/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /working capital cycle/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /score contribution by dimension/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /dupont decomposition/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /analytical engine map/i })).not.toBeInTheDocument();
    expect(screen.getByText("Current period")).toBeInTheDocument();
    expect(screen.getByText("Previous period")).toBeInTheDocument();
    expect(screen.getByLabelText(/ratio category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ratio metric/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Revenue:/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Gross Profit/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cash Conversion Cycle").length).toBeGreaterThan(0);
    expect(screen.getByText("DSO + DIO - DPO = CCC")).toBeInTheDocument();
  });

  it("renders executive insight cards with severity, evidence and no unsupported confidence", async () => {
    storeDemoSession("atlas-manufacturing-group");

    render(<ExecutiveDashboardSessionBoundary />);

    const risks = await screen.findByRole("region", { name: /executive risk cards/i });
    expect(within(risks).getAllByText("Liquidity indicators are weak").length).toBeGreaterThan(0);
    expect(within(risks).getAllByText(/severity/i).length).toBeGreaterThan(0);
    expect(within(risks).queryByText(/confidence/i)).not.toBeInTheDocument();
    expect(within(risks).queryByText(/priority/i)).not.toBeInTheDocument();
    expect(within(risks).getAllByText(/evidence/i).length).toBeGreaterThan(0);
    expect(within(risks).getByText(/Quick Ratio:/i)).toBeInTheDocument();
  });

  it("filters selectable ratio metrics by category with keyboard-accessible controls", async () => {
    const user = userEvent.setup();
    storeDemoSession("novatech-solutions");

    render(<ExecutiveDashboardSessionBoundary />);

    await screen.findByText("NovaTech Solutions");
    expect(screen.getByRole("option", { name: "EBIT Margin" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Gross Profit" })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/ratio category/i), "liquidity");
    expect(screen.getByRole("option", { name: "Current Ratio" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "EBIT Margin" })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/ratio metric/i), "quick-ratio");
    expect(screen.getAllByText(/Quick Ratio/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("region", { name: /selectable ratio trend/i })).toHaveTextContent(/Metric unit:\s*multiple/i);
    await user.selectOptions(screen.getByLabelText(/ratio category/i), "cash-flow");
    expect(screen.getByRole("option", { name: "Free Cash Flow Margin" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Free Cash Flow" })).not.toBeInTheDocument();
  });

  it("renders detailed ratio groups and keyboard-expandable formula details without raw metric ids", async () => {
    storeDemoSession("atlas-manufacturing-group");

    render(<ExecutiveDashboardSessionBoundary />);

    const table = await screen.findByRole("region", { name: /detailed ratio table/i });
    expect(within(table).getByRole("heading", { name: "Profitability" })).toBeInTheDocument();
    expect(within(table).getByRole("heading", { name: "Liquidity" })).toBeInTheDocument();
    expect(within(table).getAllByText("Formula and interpretation").length).toBeGreaterThan(0);
    expect(within(table).queryByText("current-ratio")).not.toBeInTheDocument();
  });
});
