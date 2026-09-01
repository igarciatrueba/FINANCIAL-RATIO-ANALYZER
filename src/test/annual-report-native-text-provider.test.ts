// @vitest-environment node

import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";
import { NativePdfTextProvider } from "@/server/document-extraction/native-pdf-text-provider";

function createMinimalPdf(content: string) {
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n",
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(body.length);
    body += object;
  }
  const xrefOffset = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(body);
}

describe("native PDF text provider", () => {
  it("keeps the native PDF parser external to the Next server bundle", () => {
    expect(nextConfig.serverExternalPackages).toContain("pdfjs-dist");
  });

  it("extracts positioned native text without any OCR adapter", async () => {
    const result = await new NativePdfTextProvider().extract({
      bytes: createMinimalPdf("BT /F1 12 Tf 72 720 Td (Revenue 4725) Tj ET"),
    });

    expect(result.pageCount).toBe(1);
    expect(result.pages[0]).toMatchObject({ extractionMode: "native_text" });
    expect(result.pages[0]?.tokens.map((token) => token.text).join(" ")).toContain("Revenue 4725");
  });

  it("marks a textless page as scanned-page unsupported instead of generating a value", async () => {
    const result = await new NativePdfTextProvider().extract({
      bytes: createMinimalPdf(""),
    });

    expect(result.pages[0]).toMatchObject({ extractionMode: "scanned_page_unsupported", tokens: [] });
  });
});
