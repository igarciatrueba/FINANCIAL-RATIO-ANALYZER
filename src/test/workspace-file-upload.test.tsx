import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FileUploadForm } from "@/features/workspace/components/workspace-forms";

const { abortDirectUploadAction, completeWorkspaceFileUploadAction, prepareWorkspaceFileUploadAction, refresh } = vi.hoisted(() => ({
  abortDirectUploadAction: vi.fn(),
  completeWorkspaceFileUploadAction: vi.fn(),
  prepareWorkspaceFileUploadAction: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/workspace/actions", () => ({
  abortDirectUploadAction,
  completeWorkspaceFileUploadAction,
  prepareWorkspaceFileUploadAction,
}));

describe("workspace private file upload", () => {
  it("uploads through an opaque authorized URL before completing server-side metadata", async () => {
    const user = userEvent.setup();
    prepareWorkspaceFileUploadAction.mockResolvedValue({ uploadUrl: "https://storage.example.test/upload", ticket: "opaque-upload-ticket" });
    completeWorkspaceFileUploadAction.mockResolvedValue({ status: "success", message: "File stored privately in your workspace." });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    render(<FileUploadForm companies={[{ id: "company-1", name: "NovaTech" }]} />);
    const file = new File(["%PDF-test"], "annual-report.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText(/private file/i), file);
    expect((screen.getByLabelText(/private file/i) as HTMLInputElement).files?.item(0)?.name).toBe("annual-report.pdf");
    fireEvent.submit(screen.getByRole("button", { name: /^upload$/i }).closest("form")!);

    await waitFor(() => expect(prepareWorkspaceFileUploadAction).toHaveBeenCalledWith(expect.objectContaining({
      originalFilename: "annual-report.pdf",
      mimeType: "application/pdf",
      sizeBytes: file.size,
    })));
    expect(fetch).toHaveBeenCalledWith("https://storage.example.test/upload", expect.objectContaining({ body: file, method: "PUT" }));
    expect(completeWorkspaceFileUploadAction).toHaveBeenCalledWith("opaque-upload-ticket");
    expect(refresh).toHaveBeenCalled();
  });
});
