import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { analyseFinancialStatements } from "@/domain";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { PremiumLanding } from "@/features/premium-landing/components/premium-landing";
import { buildPremiumLandingViewModel } from "@/features/premium-landing/lib/build-premium-landing-view-model";

describe("Premium landing navbar", () => {
  const viewModel = buildPremiumLandingViewModel(analyseFinancialStatements(cloneDemoCompany("novatech-solutions")));

  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0, writable: true });
  });

  afterEach(() => vi.restoreAllMocks());

  it("expands only after crossing the landing scroll threshold and restores at the top", () => {
    const { container } = render(<PremiumLanding viewModel={viewModel} />);
    const navbar = container.querySelector(".landing-nav-glass");

    expect(navbar).not.toHaveAttribute("data-scrolled");

    window.scrollY = 17;
    fireEvent.scroll(window);
    expect(navbar).toHaveAttribute("data-scrolled", "true");

    window.scrollY = 0;
    fireEvent.scroll(window);
    expect(navbar).not.toHaveAttribute("data-scrolled");
  });

  it("uses the approved landing font scope and strengthened supporting copy", () => {
    const { container } = render(<PremiumLanding viewModel={viewModel} />);

    expect(container.querySelector("main")).toHaveClass("landing-typography");
    expect(screen.getByText("Not just calculate what happened.")).toHaveClass("landing-supporting-copy", "text-neutral-50");
    expect(screen.getByText(/transform financial statements into validated ratios/i)).toHaveClass("landing-supporting-copy", "text-neutral-50");
    expect(screen.getByText(/every module remains connected to the same canonical financial engine/i)).toHaveClass("landing-description");
  });

});
