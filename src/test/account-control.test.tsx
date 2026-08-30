import { render, screen } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

const accountSession = vi.hoisted(() => ({
  value: {
    status: "authenticated" as const,
    user: {
      email: "igarciatrueba@example.com",
      user_metadata: { display_name: "Igarcia" },
    } as unknown as User,
    signOut: vi.fn(),
  },
}));

vi.mock("@/features/accounts/auth-session-provider", () => ({
  useAccountSession: () => accountSession.value,
}));

import { AccountControl } from "@/features/accounts/components/account-control";

describe("authenticated account control", () => {
  it("keeps the existing account-only navbar control without secondary navigation actions", () => {
    render(<AccountControl />);

    expect(screen.getByLabelText("Open account menu")).toHaveTextContent("Igarcia");
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /methodology|edit financials/i })).not.toBeInTheDocument();
  });
});
