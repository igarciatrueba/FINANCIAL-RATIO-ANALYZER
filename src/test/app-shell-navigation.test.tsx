import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/components/layout/app-shell";

describe("Phase 6 final dashboard shell navigation", () => {
  it("uses compact top navigation with active state and no desktop sidebar", () => {
    render(
      <AppShell currentPath="/analysis" subtitle="Financial condition" title="Executive Dashboard">
        <section>Dashboard content</section>
      </AppShell>
    );

    const navigation = screen.getByRole("navigation", { name: /global navigation/i });
    expect(screen.getByRole("link", { name: "EQUIVERSE home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("img", { name: "EQUIVERSE" })).toBeVisible();
    expect(within(navigation).getByRole("link", { name: /overview/i })).toHaveAttribute("aria-current", "page");
    expect(within(navigation).getByRole("link", { name: /financial input/i })).toHaveAttribute("href", "/input");
    expect(within(navigation).getByRole("link", { name: /ratio analysis/i })).toHaveAttribute("href", "/analysis/ratios");
    expect(within(navigation).getByRole("link", { name: /dupont analysis/i })).toHaveAttribute("href", "/analysis/dupont");
    expect(within(navigation).getByRole("link", { name: /scenario lab/i })).toHaveAttribute("href", "/scenario");
    expect(within(navigation).getByRole("link", { name: /methodology/i })).toHaveAttribute("href", "/methodology");
    expect(document.querySelector("aside")).not.toBeInTheDocument();
  });

  it("keeps sticky header structure opaque and keyboard reachable", async () => {
    const user = userEvent.setup();

    render(
      <AppShell currentPath="/analysis" subtitle="Financial condition" title="Executive Dashboard">
        <section>Dashboard content</section>
      </AppShell>
    );

    const header = screen.getByRole("banner");
    expect(header).toHaveAttribute("data-sticky-header", "true");
    expect(header.className).toContain("bg-background");

    const main = screen.getByRole("main");
    expect(main.className).toContain("scroll-mt-");

    await user.tab();
    expect(screen.getByRole("link", { name: /skip to content/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "EQUIVERSE home" })).toHaveFocus();
  });
});
