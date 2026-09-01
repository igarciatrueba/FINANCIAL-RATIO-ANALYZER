import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AnnualReportReviewSummary } from "@/features/annual-report-ingestion/components/annual-report-review-summary";

const { getPrivateFileUrlAction } = vi.hoisted(() => ({ getPrivateFileUrlAction: vi.fn() }));

vi.mock("@/app/workspace/actions", () => ({ getPrivateFileUrlAction }));

describe("annual report source inspection", () => {
  it("opens only an authorized short-lived source URL and keeps the source identity visible", async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    getPrivateFileUrlAction.mockResolvedValue({ url: "https://private.example.test/signed.pdf" });
    render(<AnnualReportReviewSummary draft={{
      runId: "run-1",
      sourceFileId: "file-1",
      sourceFileName: "annual-report.pdf",
      documentSummary: {},
      periodSlots: [
        { slotIndex: 0, fiscalPeriod: null, resolution: "manual_input_required" },
        { slotIndex: 1, fiscalPeriod: { label: "FY2024", year: 2024 }, resolution: "resolved" },
        { slotIndex: 2, fiscalPeriod: { label: "FY2025", year: 2025 }, resolution: "resolved" },
      ],
      candidates: [],
      fields: [{ canonicalFieldKey: "revenue", periodSlotIndex: 2, currentCandidateId: "candidate-1", originalCandidateId: "candidate-1", provenanceType: "PDF_EXTRACTED", reviewState: "NEEDS_REVIEW", formValue: null }],
    }} />);

    expect(screen.getByText(/annual-report.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/2 reporting periods resolved/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /open private source/i }));

    await waitFor(() => expect(getPrivateFileUrlAction).toHaveBeenCalledWith("file-1"));
    expect(open).toHaveBeenCalledWith("https://private.example.test/signed.pdf", "_blank", "noopener,noreferrer");
    open.mockRestore();
  });
});
