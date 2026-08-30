"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export type AccountSessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: User }
  | { status: "session-expired" }
  | { status: "unavailable" };

type AccountSessionContextValue = AccountSessionState & {
  signOut: () => Promise<void>;
};

const AccountSessionContext = createContext<AccountSessionContextValue | null>(null);

const anonymousSession: AccountSessionContextValue = {
  status: "anonymous",
  async signOut() {},
};

function toSessionState(user: User | null): AccountSessionState {
  return user ? { status: "authenticated", user } : { status: "anonymous" };
}

export function AccountSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AccountSessionState>(() => getSupabaseBrowserClient() ? { status: "loading" } : { status: "unavailable" });

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      return undefined;
    }

    let active = true;
    void client.auth.getUser().then(({ data, error }: { data: { user: User | null }; error: Error | null }) => {
      if (!active) return;
      if (error) {
        setState({ status: "session-expired" });
        return;
      }
      setState(toSessionState(data.user));
    });

    const { data: listener } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (active) setState(toSessionState(session?.user ?? null));
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AccountSessionContextValue>(() => ({
    ...state,
    async signOut() {
      const client = getSupabaseBrowserClient();
      if (!client) return;
      await client.auth.signOut();
      setState({ status: "anonymous" });
    },
  }), [state]);

  return <AccountSessionContext.Provider value={value}>{children}</AccountSessionContext.Provider>;
}

export function useAccountSession() {
  const session = useContext(AccountSessionContext);
  return session ?? anonymousSession;
}
