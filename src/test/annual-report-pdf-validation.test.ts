import { describe, expect, it } from "vitest";

import { PDF_RESOURCE_LIMITS, validatePdfUpload } from "@/server/document-extraction/validate-pdf-upload";

describe("annual report PDF validation", () => {
  it("accepts a bounded PDF byte stream with a matching MIME type and signature", () => {
    expect(() => validatePdfUpload({
      mimeType: "application/pdf",
      bytes: new TextEncoder().encode("%PDF-1.7\nexample"),
    })).not.toThrow();
  });

  it("rejects a non-PDF signature even when its supplied MIME type is PDF", () => {
    expect(() => validatePdfUpload({
      mimeType: "application/pdf",
      bytes: new TextEncoder().encode("not a PDF"),
    })).toThrow("valid PDF");
  });

  it("rejects an oversized file before parsing", () => {
    expect(() => validatePdfUpload({
      mimeType: "application/pdf",
      bytes: new Uint8Array(PDF_RESOURCE_LIMITS.maximumBytes + 1),
    })).toThrow("size");
  });
});
