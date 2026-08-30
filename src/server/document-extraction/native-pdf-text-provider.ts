import { AppError } from "@/server/errors";
import { PDF_RESOURCE_LIMITS } from "@/server/document-extraction/validate-pdf-upload";
import type { DocumentTextExtractionProvider, ParsedPdfToken, PdfResourceLimits } from "@/server/document-extraction/types";

type PdfTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
};

function toToken(item: PdfTextItem): ParsedPdfToken | null {
  const text = item.str?.trim();
  const transform = item.transform;
  if (!text || !transform || transform.length < 6) return null;

  return {
    text,
    x: transform[4] ?? 0,
    y: transform[5] ?? 0,
    width: item.width ?? 0,
    height: item.height ?? Math.abs(transform[3] ?? 0),
  };
}

export class NativePdfTextProvider implements DocumentTextExtractionProvider {
  async extract(input: { bytes: Uint8Array; limits?: PdfResourceLimits }) {
    const limits = input.limits ?? PDF_RESOURCE_LIMITS;
    if (input.bytes.byteLength > limits.maximumBytes) {
      throw new AppError("VALIDATION_ERROR", "The PDF file size is outside the allowed limit.");
    }

    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const loadingTask = pdfjs.getDocument({
        data: input.bytes,
        disableFontFace: true,
        useSystemFonts: true,
        stopAtErrors: true,
      });
      const document = await loadingTask.promise;

      if (document.numPages > limits.maximumPages) {
        await loadingTask.destroy();
        throw new AppError("VALIDATION_ERROR", "The PDF contains too many pages to process safely.");
      }

      const pages = [];
      for (let index = 1; index <= document.numPages; index += 1) {
        const page = await document.getPage(index);
        const content = await page.getTextContent();
        const tokens = content.items
          .slice(0, limits.maximumTokensPerPage + 1)
          .map((item) => toToken(item as PdfTextItem))
          .filter((token): token is ParsedPdfToken => token !== null);

        if (content.items.length > limits.maximumTokensPerPage) {
          throw new AppError("VALIDATION_ERROR", "A PDF page exceeds the safe text extraction limit.");
        }

        pages.push({
          pageNumber: index,
          extractionMode: tokens.length > 0 ? "native_text" as const : "scanned_page_unsupported" as const,
          tokens,
        });
      }

      await loadingTask.destroy();
      return { pageCount: pages.length, pages };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("VALIDATION_ERROR", "The PDF could not be read safely.");
    }
  }
}
