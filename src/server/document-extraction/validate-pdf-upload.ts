import { AppError } from "@/server/errors";
import type { PdfResourceLimits } from "@/server/document-extraction/types";

export const PDF_RESOURCE_LIMITS: PdfResourceLimits = {
  maximumBytes: 20 * 1024 * 1024,
  maximumPages: 250,
  maximumTokensPerPage: 20_000,
};

function hasPdfSignature(bytes: Uint8Array) {
  return bytes.byteLength >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
}

export function validatePdfUpload(input: { mimeType: string; bytes: Uint8Array }, limits: PdfResourceLimits = PDF_RESOURCE_LIMITS) {
  if (input.mimeType !== "application/pdf") {
    throw new AppError("VALIDATION_ERROR", "Upload a PDF annual report.");
  }

  if (input.bytes.byteLength === 0 || input.bytes.byteLength > limits.maximumBytes) {
    throw new AppError("VALIDATION_ERROR", "The PDF file size is outside the allowed limit.");
  }

  if (!hasPdfSignature(input.bytes)) {
    throw new AppError("VALIDATION_ERROR", "Upload a valid PDF document.");
  }
}
