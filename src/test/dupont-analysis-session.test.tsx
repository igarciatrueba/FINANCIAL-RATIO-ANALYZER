import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildActiveAnalysisSession, ACTIVE_ANALYSIS_STORAGE_KEY, serializeActiveAnalysisSession } from "@/features/financial-input/persistence";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { DupontSessionBoundary } from "@/features/dupont-analysis/components/dupont-session-boundary";

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

describe("Phase 7 DuPont analysis session integration", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    analyseFinancialStatementsMock.mockClear();
  });

  it("renders NovaTech DuPont analysis with context, identity, attribution and methodology", async () => {
    storeDemoSession("novatech-solutions");

    render(<DupontSessionBoundary />);

    expect(screen.getByRole("status")).toHaveTextContent(/preparing local dupont analysis/i);
    expect(await screen.findByText("NovaTech Solutions")).toBeInTheDocument();
    expect(screen.getByText("2024 vs 2023")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /executive dashboard/i })).toHaveAttribute("href", "/analysis");
    expect(screen.getByRole("link", { name: /edit financials/i })).toHaveAttribute("href", "/input");
    expect(screen.getByRole("link", { name: /methodology/i })).toHaveAttribute("href", "/methodology");
    expect(screen.getByRole("heading", { name: /return on equity/i })).toBeInTheDocument();
    expect(screen.getAllByText("Net Profit Margin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Asset Turnover").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Financial Leverage").length).toBeGreaterThan(0);
    expect(screen.getAllByText("×").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("=")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /roe driver attribution/i })).toBeInTheDocument();
    expect(screen.getByText("Attribution reconciliation")).toBeInTheDocument();
    expect(screen.getByText("Identity reconciliation")).toBeInTheDocument();
    expect(screen.getAllByText(/pp/i).length).toBeGreaterThan(0);
    expect(screen.queryByText("+2.5%")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /three-year dupont factor trends/i })).toBeInTheDocument();
    expect(screen.getByText("Indexed trend")).toBeInTheDocument();
    expect(screen.getByText("Base: first available year = 100")).toBeInTheDocument();
    expect(screen.getByText("Base year: 2022 = 100")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /formula and methodology/i })).toBeInTheDocument();
  });

  it("renders Atlas with risk-aware leverage language and no raw metric ids", async () => {
    storeDemoSession("atlas-manufacturing-group");

    render(<DupontSessionBoundary />);

    expect(await screen.findByText("Atlas Manufacturing Group")).toBeInTheDocument();
    expect(screen.getByText(/weaker net profit margin/i)).toBeInTheDocument();
    expect(screen.getAllByText(/financial dependence/i).length).toBeGreaterThan(0);
    expect(screen.queryByText("netProfitMargin")).not.toBeInTheDocument();
    expect(screen.queryByText("assetTurnover")).not.toBeInTheDocument();
  });

  it("shows safe empty, corrupt and invalid session states", async () => {
    render(<DupontSessionBoundary />);

    expect(await screen.findByRole("heading", { name: /financial statements are required/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to financial input/i })).toHaveAttribute("href", "/input");

    cleanup();
    window.sessionStorage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, "{not json");
    render(<DupontSessionBoundary />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/dupont analysis session could not be read/i);

    cleanup();
    window.sessionStorage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, savedAt: "now", data: {} }));
    render(<DupontSessionBoundary />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/failed canonical validation/i);
  });

  it("shows analysis failure without stale DuPont content and keeps actions keyboard reachable", async () => {
    const user = userEvent.setup();
    storeDemoSession("novatech-solutions");
    analyseFinancialStatementsMock.mockImplementationOnce(() => {
      throw new Error("forced failure");
    });

    const { container } = render(<DupontSessionBoundary />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/dupont analysis could not be completed/i);
    expect(screen.getByRole("link", { name: /return to financial input/i })).toHaveAttribute("href", "/input");
    expect(screen.queryByText("NovaTech Solutions")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /roe driver attribution/i })).not.toBeInTheDocument();
    expect(container.querySelector('[class*="w-screen"]')).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole("link", { name: /return to financial input/i })).toHaveFocus();
  });

  it("keeps the 320px structure free of destructive overflow classes", async () => {
    const input = cloneDemoCompany("novatech-solutions");
    input.company.name = "NovaTech International Consolidated Financial Systems and Infrastructure Holdings";
    window.sessionStorage.setItem(ACTIVE_ANALYSIS_STORAGE_KEY, serializeActiveAnalysisSession(buildActiveAnalysisSession(input)));

    const { container } = render(<DupontSessionBoundary />);

    expect(await screen.findByText(input.company.name)).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: /dupont identity/i })).getByText("Net Profit Margin")).toBeInTheDocument();
    expect(container.querySelector(".truncate")).not.toBeInTheDocument();
    expect(container.querySelector('[class*="w-screen"]')).not.toBeInTheDocument();
  });
});
