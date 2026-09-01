import { describe, expect, it } from "vitest";

import { deriveAverageBalance, deriveTotalDebt } from "@/features/annual-report-ingestion/lib/derive-financial-fields";

describe("annual report deterministic derivations", () => {
  it("derives total debt only from explicitly included evidenced components", () => {
    expect(deriveTotalDebt([
      { id: "current-borrowings", value: 120, includedInTotalDebt: true, component: "current" },
      { id: "non-current-borrowings", value: 380, includedInTotalDebt: true, component: "non_current" },
    ])).toEqual({ status: "derived", value: 500, sourceCandidateIds: ["current-borrowings", "non-current-borrowings"] });
  });

  it("leaves total debt unresolved when no valid component set is available", () => {
    expect(deriveTotalDebt([{ id: "net-debt", value: 200, includedInTotalDebt: false, component: "current" }])).toEqual({ status: "unresolved" });
    expect(deriveTotalDebt([{ id: "current-borrowings", value: 200, includedInTotalDebt: true, component: "current" }])).toEqual({ status: "unresolved" });
  });

  it("derives an average balance only when opening and closing evidence are both present", () => {
    expect(deriveAverageBalance({ id: "inventory-2024", value: 120 }, { id: "inventory-2025", value: 180 })).toEqual({
      status: "derived",
      value: 150,
      sourceCandidateIds: ["inventory-2024", "inventory-2025"],
    });
    expect(deriveAverageBalance(null, { id: "inventory-2025", value: 180 })).toEqual({ status: "unresolved" });
  });
});
