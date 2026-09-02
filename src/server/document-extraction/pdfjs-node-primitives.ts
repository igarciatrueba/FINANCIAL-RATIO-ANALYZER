import { DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";

// PDF.js conditionally imports these primitives. The explicit import keeps the
// native dependency traceable in serverless bundles where optional imports are pruned.
export function ensurePdfJsNodePrimitives() {
  const nodeGlobals = globalThis as unknown as Record<string, unknown>;
  nodeGlobals.DOMMatrix ??= DOMMatrix;
  nodeGlobals.ImageData ??= ImageData;
  nodeGlobals.Path2D ??= Path2D;
}
