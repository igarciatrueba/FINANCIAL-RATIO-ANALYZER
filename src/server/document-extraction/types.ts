export type ParsedPdfToken = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ParsedPdfPage = {
  pageNumber: number;
  extractionMode: "native_text" | "scanned_page_unsupported";
  tokens: ParsedPdfToken[];
};

export type PdfResourceLimits = {
  maximumBytes: number;
  maximumPages: number;
  maximumTokensPerPage: number;
};

export interface DocumentTextExtractionProvider {
  extract(input: { bytes: Uint8Array; limits?: PdfResourceLimits }): Promise<{
    pageCount: number;
    pages: ParsedPdfPage[];
  }>;
}
