import { AppError } from "@/server/errors";

const expectedClientCodes = new Set(["UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", "VALIDATION_ERROR", "CONFLICT"]);

/** Emits production-diagnosable events without serializing user input, secrets or provider errors. */
export function logSafeServerFailure(event: string, error: unknown) {
  const code = error instanceof AppError ? error.code : "UNEXPECTED";
  if (expectedClientCodes.has(code)) return;
  console.error(JSON.stringify({ event, code }));
}
