import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AccountControl } from "@/features/accounts/components/account-control";
import { AuthScreen } from "@/features/accounts/components/auth-screen";
import { authErrorMessage } from "@/features/accounts/lib/auth-error-message";
import {
  PERSISTED_ANALYSIS_CONTEXT_KEY,
  recoverPersistedAnalysisContext,
} from "@/features/accounts/persisted-analysis-context";
import { WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import { CreateCompanyForm } from "@/features/workspace/components/workspace-forms";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("Equiverse accounts and workspace boundaries", () => {
  it("maps provider errors to safe account-facing messages", () => {
    expect(authErrorMessage(new Error("Invalid login credentials"))).toBe("Incorrect email or password.");
    expect(authErrorMessage(new Error("User already registered"))).toBe("If an account can use this email, sign in or check your inbox.");
    expect(authErrorMessage(new Error("over_email_send_rate_limit"))).toBe("Too many email requests. Please wait a few minutes before trying again.");
    expect(authErrorMessage(new Error("Auth session missing after a recovery link expired"))).toBe("Your password reset link is invalid or has expired. Request a new one.");
    expect(authErrorMessage(new Error("internal provider failure"))).toBe("We could not complete that account request. Please try again.");
  });

  it("recovers only complete persisted analysis context without exposing storage implementation data", () => {
    expect(recoverPersistedAnalysisContext(JSON.stringify({ runId: "run-1", companyId: "company-1", datasetVersionId: "version-1" }))).toEqual({ runId: "run-1", companyId: "company-1", datasetVersionId: "version-1" });
    expect(recoverPersistedAnalysisContext(JSON.stringify({ runId: "run-1" }))).toBeNull();
    expect(recoverPersistedAnalysisContext("{" )).toBeNull();
    expect(PERSISTED_ANALYSIS_CONTEXT_KEY).toContain("persisted-analysis-context");
  });

  it("keeps anonymous discovery available while exposing a sign-in entry point", () => {
    render(<AccountControl />);

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  it("renders the minimal EQUIVERSE authentication routes with permanent labels", () => {
    const { rerender } = render(<AuthScreen mode="login" />);
    expect(screen.getByRole("heading", { name: "Welcome back." })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");

    rerender(<AuthScreen mode="signup" />);
    expect(screen.getByRole("heading", { name: "Create your EQUIVERSE workspace." })).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
  });

  it("provides keyboard-reachable workspace navigation without replacing the global product navigation", () => {
    render(<WorkspaceShell currentPath="/workspace/history" subtitle="Stored results" title="Analysis History"><h1>Stored analysis</h1></WorkspaceShell>);

    const navigation = screen.getByRole("navigation", { name: "Workspace navigation" });
    expect(within(navigation).getByRole("link", { name: "Analysis history" })).toHaveAttribute("aria-current", "page");
    expect(within(navigation).getByRole("link", { name: "Files" })).toHaveAttribute("href", "/workspace/files");
    expect(screen.getByRole("navigation", { name: "Global navigation" })).toBeInTheDocument();
  });

  it("keeps the first-company controls in a two-column layout that can fit the workspace panel", () => {
    render(<CreateCompanyForm />);

    const form = screen.getByRole("button", { name: "Add company" }).closest("form");
    expect(form).toHaveClass("sm:grid-cols-2");
    expect(form).not.toHaveClass("sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem_auto]");
    expect(screen.getByLabelText("Company name")).toBeVisible();
    expect(screen.getByLabelText("Industry")).toBeVisible();
    expect(screen.getByLabelText("Currency")).toBeVisible();
  });
});
