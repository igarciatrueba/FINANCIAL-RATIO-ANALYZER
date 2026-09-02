// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

const pdfMock = vi.hoisted(() => {
  const destroy = vi.fn();
  return {
    destroy,
    getDocument: vi.fn(() => ({
      destroy,
      promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({
          getTextContent: async () => ({
            items: [
              { str: "Revenue", transform: [1, 0, 0, 1, 0, 0] },
              { str: "100", transform: [1, 0, 0, 1, 1, 0] },
            ],
          }),
        }),
      }),
    })),
  };
});

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({ getDocument: pdfMock.getDocument }));

import { NativePdfTextProvider } from "@/server/document-extraction/native-pdf-text-provider";

describe("native PDF parser resource cleanup", () => {
  it("destroys the PDF loading task when a page exceeds the token limit", async () => {
    await expect(new NativePdfTextProvider().extract({
      bytes: new TextEncoder().encode("%PDF-1.7"),
      limits: { maximumBytes: 1024, maximumPages: 10, maximumTokensPerPage: 1 },
    })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    expect(pdfMock.destroy).toHaveBeenCalledTimes(1);
  });

  it("converts a native parser exception into a safe validation error", async () => {
    pdfMock.getDocument.mockReturnValueOnce({
      destroy: pdfMock.destroy,
      promise: Promise.reject(new Error("parser implementation detail")),
    });

    await expect(new NativePdfTextProvider().extract({
      bytes: new TextEncoder().encode("%PDF-1.7"),
    })).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      safeMessage: "The PDF could not be read safely.",
    });
  });

  it("rejects excessive page counts before iterating document content", async () => {
    pdfMock.getDocument.mockReturnValueOnce({
      destroy: pdfMock.destroy,
      promise: Promise.resolve({
        numPages: 2,
        getPage: async () => ({ getTextContent: async () => ({ items: [] }) }),
      }),
    });

    await expect(new NativePdfTextProvider().extract({
      bytes: new TextEncoder().encode("%PDF-1.7"),
      limits: { maximumBytes: 1024, maximumPages: 1, maximumTokensPerPage: 10 },
    })).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      safeMessage: "The PDF contains too many pages to process safely.",
    });
  });
});
