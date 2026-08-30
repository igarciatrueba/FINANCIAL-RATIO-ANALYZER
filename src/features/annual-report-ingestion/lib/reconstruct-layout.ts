import type { ParsedPdfPage, ParsedPdfToken } from "@/server/document-extraction/types";

export type LayoutCell = {
  text: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type LayoutRow = {
  cells: LayoutCell[];
  y?: number;
};

export type ReconstructedPageLayout = {
  pageNumber: number;
  rows: LayoutRow[];
};

const ROW_TOLERANCE = 3;

function byVisualOrder(left: ParsedPdfToken, right: ParsedPdfToken) {
  if (Math.abs(left.y - right.y) > ROW_TOLERANCE) return right.y - left.y;
  return left.x - right.x;
}

export function reconstructPageLayout(page: ParsedPdfPage): ReconstructedPageLayout {
  const rows: Array<{ y: number; tokens: ParsedPdfToken[] }> = [];

  for (const token of [...page.tokens].sort(byVisualOrder)) {
    const row = rows.find((candidate) => Math.abs(candidate.y - token.y) <= ROW_TOLERANCE);
    if (row) {
      row.tokens.push(token);
    } else {
      rows.push({ y: token.y, tokens: [token] });
    }
  }

  return {
    pageNumber: page.pageNumber,
    rows: rows
      .sort((left, right) => right.y - left.y)
      .map((row) => ({
        y: row.y,
        cells: row.tokens.sort((left, right) => left.x - right.x).map((token) => ({ ...token })),
      })),
  };
}
