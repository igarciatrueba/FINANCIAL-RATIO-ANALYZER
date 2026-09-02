export function authErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "";
  const normalized = `${message} ${code}`.toLowerCase().replaceAll(/[_-]/g, " ");

  if (normalized.includes("auth session missing") || normalized.includes("recovery link") || normalized.includes("token has expired")) {
    return "Your password reset link is invalid or has expired. Request a new one.";
  }
  if (normalized.includes("invalid login") || normalized.includes("invalid credentials")) return "Incorrect email or password.";
  if (normalized.includes("already registered") || normalized.includes("already been registered")) return "If an account can use this email, sign in or check your inbox.";
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) return "Too many email requests. Please wait a few minutes before trying again.";
  if (normalized.includes("email") && normalized.includes("confirm")) return "Check your email to verify your account.";
  if (normalized.includes("password")) return "Your password does not meet the provider requirements.";
  return "We could not complete that account request. Please try again.";
}
