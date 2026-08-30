import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { chartTheme } from "@/features/executive-dashboard/charts/chart-theme";

const globalStyles = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("global V2 typography system", () => {
  it("uses the approved UI font token for standard and tabular interface text", () => {
    expect(globalStyles).toContain("--font-ui: Inter, Arial, sans-serif;");
    expect(globalStyles).toContain("--font-sans: var(--font-ui);");
    expect(globalStyles).toContain("--font-mono: var(--font-ui);");
    expect(globalStyles).toContain("body {\n  margin: 0;\n  min-width: 320px;");
    expect(globalStyles).toContain("font-family: var(--font-ui);");
    expect(globalStyles).toContain("font-weight: 500;");
    expect(globalStyles).toContain("button { font-weight: 600; }");
  });

  it("reserves the technical font for semantic formula content only", () => {
    expect(globalStyles).toContain("--font-technical: \"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace;");
    expect(globalStyles).toContain(".font-technical { font-family: var(--font-technical); }");
    expect(globalStyles).toContain(".premium-kicker { color: #60a5fa; font-family: var(--font-ui);");
  });

  it("keeps chart labels and numeric axes in the approved UI family", () => {
    expect(chartTheme.fontFamily).toBe("Inter, Arial, sans-serif");
    expect(chartTheme.monoFontFamily).toBe(chartTheme.fontFamily);
  });
});
