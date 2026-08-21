export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "STORAGE_ERROR"
  | "ANALYSIS_FAILED"
  | "CONFIGURATION_ERROR";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly safeMessage: string;

  constructor(code: AppErrorCode, safeMessage: string) {
    super(safeMessage);
    this.name = "AppError";
    this.code = code;
    this.safeMessage = safeMessage;
  }
}
