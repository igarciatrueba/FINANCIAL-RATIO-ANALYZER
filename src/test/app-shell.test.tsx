import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/components/layout/app-shell";
import { APP_NAVIGATION } from "@/components/layout/navigation";
import { cn } from "@/lib/utils";

describe("Phase 1 application shell", () => {
  it("exposes the approved primary navigation routes", () => {
    const routeLabels = APP_NAVIGATION.map((item) => item.label);

    expect(routeLabels).toEqual([
      "Overview",
      "Financial Input",
      "Ratio Analysis",
      "DuPont Analysis",
      "Scenario Lab",
      "Engine Map",
      "Methodology",
    ]);
  });

  it("renders accessible navigation around page content", () => {
    render(
      <AppShell>
        <h1>Foundation page</h1>
      </AppShell>
    );

    const primaryNavigation = screen.getByRole("navigation", { name: "Global navigation" });

    expect(primaryNavigation).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole("link", { name: /financial input/i })).toHaveAttribute(
      "href",
      "/input"
    );
    expect(screen.getByRole("heading", { name: "Foundation page" })).toBeInTheDocument();
  });

  it("merges Tailwind utility classes for shadcn-style primitives", () => {
    expect(cn("rounded-md px-4", "px-6", false && "hidden")).toBe("rounded-md px-6");
  });
});
