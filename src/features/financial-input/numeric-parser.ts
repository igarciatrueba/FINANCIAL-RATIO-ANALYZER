export type NumericParseFailureCode = "required" | "invalid-format";

export type NumericParseResult =
  | {
      success: true;
      value: number;
    }
  | {
      success: false;
      code: NumericParseFailureCode;
      message: string;
    };

const plainNumberPattern = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

export function parsePlainNumber(value: string): NumericParseResult {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return {
      success: false,
      code: "required",
      message: "Enter a value.",
    };
  }

  if (!plainNumberPattern.test(trimmed)) {
    return {
      success: false,
      code: "invalid-format",
      message: "Enter a plain number without currency symbols or thousands separators.",
    };
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    return {
      success: false,
      code: "invalid-format",
      message: "Enter a finite number.",
    };
  }

  return {
    success: true,
    value: parsed,
  };
}

export function parseIntegerString(value: string, label: string): NumericParseResult {
  const result = parsePlainNumber(value);

  if (!result.success) {
    return {
      ...result,
      message: result.code === "required" ? `${label} is required.` : `${label} must be an integer year.`,
    };
  }

  if (!Number.isInteger(result.value)) {
    return {
      success: false,
      code: "invalid-format",
      message: `${label} must be an integer year.`,
    };
  }

  return result;
}
