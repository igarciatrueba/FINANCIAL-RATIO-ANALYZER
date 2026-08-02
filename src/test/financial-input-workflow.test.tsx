import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AnalysisConfirmation } from "@/features/financial-input/analysis-confirmation";
import { ACTIVE_ANALYSIS_STORAGE_KEY, INPUT_DRAFT_STORAGE_KEY } from "@/features/financial-input/persistence";
import { FinancialInputWorkflow } from "@/features/financial-input/workflow";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("Phase 4 financial input workflow", () => {
  beforeEach(() => {
    pushMock.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a top horizontal workflow bar with compact progress and free step navigation", async () => {
    const user = userEvent.setup();
    render(<FinancialInputWorkflow />);

    const workflowNav = screen.getByRole("navigation", { name: /financial input workflow/i });
    expect(workflowNav).toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/compact workflow progress/i)).toHaveTextContent("Step 1 of 6");

    await user.click(within(workflowNav).getByRole("button", { name: /balance sheet/i }));

    expect(screen.getByRole("heading", { name: /balance sheet/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/compact workflow progress/i)).toHaveTextContent("Step 3 of 6");
  });

  it("keeps visible labels and renders three annual values for every financial concept", async () => {
    const user = userEvent.setup();
    render(<FinancialInputWorkflow />);

    await user.click(screen.getByRole("button", { name: /load novatech solutions/i }));
    await user.click(screen.getByRole("button", { name: /^income statement/i }));

    const revenueGroup = screen.getByRole("group", { name: /revenue/i });
    expect(within(revenueGroup).getByLabelText(/revenue 2022/i)).toHaveValue(1280);
    expect(within(revenueGroup).getByLabelText(/revenue 2023/i)).toHaveValue(1540);
    expect(within(revenueGroup).getByLabelText(/revenue 2024/i)).toHaveValue(1880);
  });

  it("validates fields on blur and sections when saving", async () => {
    const user = userEvent.setup();
    render(<FinancialInputWorkflow />);

    const companyName = screen.getByLabelText(/company name/i);
    await user.clear(companyName);
    await user.tab();

    expect(await screen.findByText(/company name is required/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /save and continue/i }));

    expect(await screen.findByText(/reporting year 1 is required/i)).toBeInTheDocument();
  });

  it("loads both demos as editable copied form values", async () => {
    const user = userEvent.setup();
    render(<FinancialInputWorkflow />);

    await user.click(screen.getByRole("button", { name: /load atlas manufacturing group/i }));
    expect(screen.getByLabelText(/company name/i)).toHaveValue("Atlas Manufacturing Group");

    const industry = screen.getByLabelText(/industry/i);
    await user.clear(industry);
    await user.type(industry, "Industrial Components");

    expect(industry).toHaveValue("Industrial Components");

    await user.click(screen.getByRole("button", { name: /load novatech solutions/i }));
    expect(screen.getByLabelText(/company name/i)).toHaveValue("NovaTech Solutions");
  });

  it("groups errors, warnings and information on review while warnings allow analysis", async () => {
    const user = userEvent.setup();
    render(<FinancialInputWorkflow />);

    await user.click(screen.getByRole("button", { name: /load novatech solutions/i }));
    await user.click(screen.getByRole("button", { name: /^income statement/i }));
    await user.clear(screen.getByLabelText(/revenue 2022/i));
    await user.type(screen.getByLabelText(/revenue 2022/i), "0");
    await user.click(screen.getByRole("button", { name: /^review/i }));

    expect(await screen.findByRole("heading", { name: /review/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /warnings/i })).toHaveTextContent("Revenue is zero or negative");
    expect(screen.getByRole("region", { name: /information/i })).toHaveTextContent("educational analytical tool");
    expect(screen.getByRole("button", { name: /analyse company/i })).toBeEnabled();
  });

  it("disables analysis when blocking errors remain", async () => {
    const user = userEvent.setup();
    render(<FinancialInputWorkflow />);

    await user.click(screen.getByRole("button", { name: /^review/i }));

    expect(await screen.findByRole("button", { name: /analyse company/i })).toBeDisabled();
    expect(screen.getByRole("region", { name: /blocking errors/i })).toHaveTextContent("Company name is required");
  });

  it("stores accepted canonical analysis input in session storage and navigates to analysis", async () => {
    const user = userEvent.setup();
    render(<FinancialInputWorkflow />);

    await user.click(screen.getByRole("button", { name: /load atlas manufacturing group/i }));
    await user.click(screen.getByRole("button", { name: /^review/i }));
    await user.click(await screen.findByRole("button", { name: /analyse company/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/analysis"));
    const stored = JSON.parse(window.sessionStorage.getItem(ACTIVE_ANALYSIS_STORAGE_KEY) ?? "{}");
    expect(stored.data.company.name).toBe("Atlas Manufacturing Group");
    expect(stored.data.periods.map((period: { year: number }) => period.year)).toEqual([2022, 2023, 2024]);
  });

  it("supports keyboard navigation through workflow controls", async () => {
    const user = userEvent.setup();
    render(<FinancialInputWorkflow />);

    await user.tab();
    expect(screen.getByRole("button", { name: /load novatech solutions/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: /load atlas manufacturing group/i })).toHaveFocus();
  });

  it("does not recreate a local draft after reset autosave debounce elapses", async () => {
    vi.useFakeTimers();
    render(<FinancialInputWorkflow />);

    fireEvent.click(screen.getByRole("button", { name: /load novatech solutions/i }));
    await vi.advanceTimersByTimeAsync(600);
    expect(window.localStorage.getItem(INPUT_DRAFT_STORAGE_KEY)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /reset form/i }));
    expect(window.localStorage.getItem(INPUT_DRAFT_STORAGE_KEY)).toBeNull();

    await vi.advanceTimersByTimeAsync(600);
    expect(window.localStorage.getItem(INPUT_DRAFT_STORAGE_KEY)).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Local draft cleared");
  });
});

describe("Phase 4 temporary analysis confirmation", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("shows a safe empty state when no accepted analysis session exists", () => {
    render(<AnalysisConfirmation />);

    expect(screen.getByRole("heading", { name: /no accepted analysis found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return to financial input/i })).toHaveAttribute("href", "/input");
  });

  it("revalidates session data before showing accepted canonical details", async () => {
    const user = userEvent.setup();
    render(<FinancialInputWorkflow />);

    await user.click(screen.getByRole("button", { name: /load novatech solutions/i }));
    await user.click(screen.getByRole("button", { name: /^review/i }));
    await user.click(await screen.findByRole("button", { name: /analyse company/i }));

    render(<AnalysisConfirmation />);

    expect(screen.getByRole("heading", { name: /canonical dataset accepted/i })).toBeInTheDocument();
    expect(screen.getByText("NovaTech Solutions")).toBeInTheDocument();
    expect(screen.getByText("2022, 2023, 2024")).toBeInTheDocument();
    expect(screen.getByText("EUR")).toBeInTheDocument();
    expect(screen.getByText(/financial metrics are ready/i)).toBeInTheDocument();
  });
});
