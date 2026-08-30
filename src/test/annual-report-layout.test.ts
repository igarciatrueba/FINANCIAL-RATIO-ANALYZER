import { describe, expect, it } from "vitest";

import { reconstructPageLayout } from "@/features/annual-report-ingestion/lib/reconstruct-layout";

describe("annual report page layout", () => {
  it("groups native text tokens into coordinate ordered table rows", () => {
    const layout = reconstructPageLayout({
      pageNumber: 12,
      extractionMode: "native_text",
      tokens: [
        { text: "Revenue", x: 72, y: 720, width: 48, height: 12 },
        { text: "4,725", x: 400, y: 720, width: 32, height: 12 },
        { text: "4,381", x: 500, y: 720, width: 32, height: 12 },
        { text: "Cost of sales", x: 72, y: 700, width: 78, height: 12 },
        { text: "(2,010)", x: 400, y: 700, width: 42, height: 12 },
      ],
    });

    expect(layout.rows.map((row) => row.cells.map((cell) => cell.text))).toEqual([
      ["Revenue", "4,725", "4,381"],
      ["Cost of sales", "(2,010)"],
    ]);
  });
});
