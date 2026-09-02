import { describe, expect, it } from "vitest";

import { ensurePdfJsNodePrimitives } from "@/server/document-extraction/pdfjs-node-primitives";

describe("PDF.js Node runtime primitives", () => {
  it("provides the Canvas primitives PDF.js needs before native text extraction", () => {
    ensurePdfJsNodePrimitives();

    expect(globalThis.DOMMatrix).toBeDefined();
    expect(globalThis.ImageData).toBeDefined();
    expect(globalThis.Path2D).toBeDefined();
  });
});
