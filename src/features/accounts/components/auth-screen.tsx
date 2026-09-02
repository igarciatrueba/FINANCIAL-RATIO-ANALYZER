"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";

import { EquiverseLogo } from "@/components/brand/equiverse-logo";
import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/features/accounts/lib/auth-error-message";
import { getSafeAuthReturnPath } from "@/features/accounts/lib/auth-return-path";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

type AuthMode = "login" | "signup" | "forgot-password" | "reset-password";

const content: Record<AuthMode, { eyebrow: string; title: string; description: string; submit: string }> = {
  login: { eyebrow: "Account access", title: "Welcome back.", description: "Continue your financial analysis workspace.", submit: "Sign in" },
  signup: { eyebrow: "Persistent workspace", title: "Create your EQUIVERSE workspace.", description: "Save companies, analysis history, files and scenarios without interrupting the anonymous product experience.", submit: "Create account" },
  "forgot-password": { eyebrow: "Password recovery", title: "Reset your password.", description: "We will send a private recovery link to your email address.", submit: "Send reset link" },
  "reset-password": { eyebrow: "Password recovery", title: "Choose a new password.", description: "Your password is handled by the configured Supabase provider.", submit: "Update password" },
};

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState(searchParams.get("verified") === "1" ? "Your email is verified. You can sign in now." : null);
  const [pending, setPending] = useState(false);
  const copy = content[mode];
  const next = getSafeAuthReturnPath(searchParams.get("next"));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    const client = getSupabaseBrowserClient();

    if (!client) {
      setError("Account services are not configured in this environment.");
      return;
    }
    if (!email && mode !== "reset-password") {
      setError("Enter your email address.");
      return;
    }
    if (mode === "signup" && password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setNotice(null);
    setPending(true);
    try {
      if (mode === "login") {
        const { error: authError } = await client.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.replace(next);
        router.refresh();
        return;
      }
      if (mode === "signup") {
        const { error: authError } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/login?verified=1` },
        });
        if (authError) throw authError;
        setNotice("Check your email to verify your account, then return here to sign in.");
        return;
      }
      if (mode === "forgot-password") {
        const { error: authError } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (authError) throw authError;
        setNotice("If this email is registered, a password reset link is on its way.");
        return;
      }
      const { error: authError } = await client.auth.updateUser({ password });
      if (authError) throw authError;
      setNotice("Your password was updated. You can continue to your workspace.");
      router.refresh();
    } catch (authError) {
      setError(authErrorMessage(authError));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="premium-shell premium-ambient grid min-h-screen place-items-center px-4 py-10 text-neutral-50">
      <section className="crystal-surface w-full max-w-md rounded-xl p-6 shadow-3 sm:p-8" aria-labelledby="auth-heading">
        <Link aria-label="EQUIVERSE home" className="inline-flex" href="/"><EquiverseLogo className="h-7 w-auto" priority /></Link>
        <p className="premium-kicker mt-10">{copy.eyebrow}</p>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-white" id="auth-heading">{copy.title}</h1>
        <p className="mt-3 text-small leading-6 text-neutral-300">{copy.description}</p>

        <form className="mt-8 grid gap-5" noValidate onSubmit={submit}>
          {mode !== "reset-password" ? <label className="grid gap-2 text-small font-semibold text-neutral-200">Email<input autoComplete="email" className="min-h-12 rounded-md border border-border bg-background/80 px-4 text-body text-white outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-400/25" name="email" required type="email" /></label> : null}
          {mode !== "forgot-password" ? <label className="grid gap-2 text-small font-semibold text-neutral-200">Password<input autoComplete={mode === "login" ? "current-password" : "new-password"} className="min-h-12 rounded-md border border-border bg-background/80 px-4 text-body text-white outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-400/25" name="password" required type="password" /></label> : null}
          {mode === "signup" ? <label className="grid gap-2 text-small font-semibold text-neutral-200">Confirm password<input autoComplete="new-password" className="min-h-12 rounded-md border border-border bg-background/80 px-4 text-body text-white outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-400/25" name="confirmation" required type="password" /></label> : null}
          {error ? <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-small text-red-100" role="alert">{error}</p> : null}
          {notice ? <p className="flex gap-2 rounded-md border border-success/35 bg-success/10 px-3 py-2 text-small text-emerald-100" role="status"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{notice}</p> : null}
          <Button className="mt-1 w-full" disabled={pending} type="submit">{pending ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <KeyRound aria-hidden="true" className="h-4 w-4" />}{copy.submit}</Button>
        </form>

        <div className="mt-6 flex flex-wrap justify-between gap-3 text-caption text-neutral-400">
          {mode === "login" ? <><Link className="text-blue-200 hover:text-white" href="/forgot-password">Forgot password?</Link><Link className="text-blue-200 hover:text-white" href="/signup">Create account <ArrowRight aria-hidden="true" className="inline h-3.5 w-3.5" /></Link></> : null}
          {mode === "signup" ? <Link className="text-blue-200 hover:text-white" href="/login">Already have an account? Sign in</Link> : null}
          {mode === "forgot-password" || mode === "reset-password" ? <Link className="text-blue-200 hover:text-white" href="/login">Back to sign in</Link> : null}
        </div>
      </section>
    </main>
  );
}
