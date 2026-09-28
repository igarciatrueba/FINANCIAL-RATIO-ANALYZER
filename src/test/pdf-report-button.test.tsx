import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PrintReportButton } from "@/components/print-report-button";
import { analyseFinancialStatements } from "@/domain";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { buildExecutiveDashboardViewModel } from "@/features/executive-dashboard/lib/build-dashboard-view-model";

const download = vi.hoisted(() => vi.fn());
vi.mock("@/features/pdf-report/download-report", () => ({ downloadExecutiveReport: download }));
afterEach(() => vi.restoreAllMocks());
function setup() {
  const input = cloneDemoCompany("novatech-solutions");
  const vm = buildExecutiveDashboardViewModel(analyseFinancialStatements(input), input);
  render(<PrintReportButton viewModel={vm} />);
  return vm;
}
it("preserves the button label and exports the exact VM only on demand without printing", async () => {
  download.mockReset().mockResolvedValue(undefined);
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  const vm = setup();
  expect(download).not.toHaveBeenCalled();
  const button = screen.getByRole("button", { name: "Print / Save PDF" });
  expect(button).toHaveClass("print:hidden");
  fireEvent.click(button);
  await waitFor(() => expect(download).toHaveBeenCalledWith(vm));
  expect(print).not.toHaveBeenCalled();
  expect(button).toHaveTextContent("Print / Save PDF");
});
it("prevents duplicate exports and provides an accessible recoverable error", async () => {
  let reject!: (reason: Error) => void;
  download.mockReset().mockImplementation(() => new Promise((_, fail) => { reject = fail; }));
  const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
  setup();
  const button = screen.getByRole("button", { name: "Print / Save PDF" });
  fireEvent.click(button); fireEvent.click(button);
  await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
  reject(new Error("Unavailable export"));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("PDF generation failed"));
  expect(alert).toHaveBeenCalled();
  download.mockResolvedValue(undefined);
  fireEvent.click(button);
  await waitFor(() => expect(download).toHaveBeenCalledTimes(2));
});
