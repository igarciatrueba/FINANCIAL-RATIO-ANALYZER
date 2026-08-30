export function authErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("invalid login") || message.includes("invalid credentials")) return "Incorrect email or password.";
  if (message.includes("already registered") || message.includes("already been registered")) return "This email is already registered. Sign in instead.";
  if (message.includes("password")) return "Your password does not meet the provider requirements.";
  if (message.includes("email") && message.includes("confirm")) return "Check your email to verify your account.";
  if (message.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  return "We could not complete that account request. Please try again.";
}
