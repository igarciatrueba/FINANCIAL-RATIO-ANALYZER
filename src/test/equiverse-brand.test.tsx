import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { metadata } from "@/app/layout";
import { EquiverseLogo } from "@/components/brand/equiverse-logo";
import { analyseFinancialStatements } from "@/domain";
import { cloneDemoCompany } from "@/features/financial-input/demo-companies";
import { PremiumLanding } from "@/features/premium-landing/components/premium-landing";
import { buildPremiumLandingViewModel } from "@/features/premium-landing/lib/build-premium-landing-view-model";
import { BRAND } from "@/lib/brand";

describe("EQUIVERSE brand identity", () => {
  it("uses the production PNG wordmark with an accessible name", () => {
    render(<EquiverseLogo priority />);

    expect(BRAND.name).toBe("EQUIVERSE");
    expect(screen.getByRole("img", { name: "EQUIVERSE" })).toHaveAttribute("src", expect.stringContaining("equiverse-logo.png"));
  });

  it("uses EQUIVERSE in browser and Open Graph metadata", () => {
    expect(metadata.applicationName).toBe(BRAND.name);
    expect(metadata.title).toMatchObject({ default: BRAND.name, template: `%s | ${BRAND.name}` });
    expect(metadata.openGraph?.title).toBe(BRAND.name);
    expect(metadata.openGraph?.images).toEqual(expect.arrayContaining([
      expect.objectContaining({ alt: BRAND.name }),
    ]));
  });

  it("uses the PNG wordmark as the landing home link", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    });

    render(<PremiumLanding viewModel={buildPremiumLandingViewModel(analyseFinancialStatements(cloneDemoCompany("novatech-solutions")))} />);

    expect(screen.getByRole("link", { name: "EQUIVERSE home" })).toHaveAttribute("href", BRAND.homeHref);
    expect(screen.getByRole("img", { name: "EQUIVERSE" })).toHaveAttribute("src", expect.stringContaining("equiverse-logo.png"));
  });
});
