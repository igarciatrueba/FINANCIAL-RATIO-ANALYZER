import type { CurrencyCode, MetricResult, RatioDefinition } from "@/domain";
import type { FormattedFinancialValue } from "@/features/executive-dashboard/types/dashboard.types";

type FormatUnit = RatioDefinition["unit"] | "score" | "score-change";

type FormatFinancialValueInput = {
  value: number | null;
  unit: FormatUnit;
  currency?: CurrencyCode;
  unavailableReason?: string;
  signed?: boolean;
};

const locale = "en-US";

const currencyFormatters = new Map<CurrencyCode, Intl.NumberFormat>();

function currencyFormatter(currency: CurrencyCode) {
  const existing = currencyFormatters.get(currency);
  if (existing) {
    return existing;
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  currencyFormatters.set(currency, formatter);
  return formatter;
}

function signedPrefix(value: number, signed?: boolean) {
  return signed && value > 0 ? "+" : "";
}

function unavailable(reason?: string): FormattedFinancialValue {
  return {
    display: "Unavailable",
    accessibleText: reason ? `Unavailable: ${reason}` : "Unavailable",
    title: reason ? `Unavailable: ${reason}` : "Unavailable",
    unitLabel: "Unavailable",
    unavailableReason: reason,
  };
}

function displayZeroTolerance(unit: FormatUnit) {
  switch (unit) {
    case "currency":
      return 0.5;
    case "multiple":
      return 0.005;
    case "percentage":
      return 0.0005;
    case "days":
    case "score":
    case "score-change":
      return 0.05;
  }
}

export function reasonForUnavailableMetric(metric: MetricResult | undefined) {
  return metric?.status === "unavailable" ? metric.reason : undefined;
}

export function valueFromMetric(metric: MetricResult | undefined) {
  return metric?.status === "available" && Number.isFinite(metric.value) ? metric.value : null;
}

export function formatFinancialValue(input: FormatFinancialValueInput): FormattedFinancialValue {
  const { unit, currency = "EUR", unavailableReason, signed } = input;
  const value =
    input.value !== null && Number.isFinite(input.value) && Math.abs(input.value) < displayZeroTolerance(unit)
      ? 0
      : input.value;

  if (value === null || !Number.isFinite(value)) {
    return unavailable(unavailableReason);
  }

  if (unit === "currency") {
    const display = `${signedPrefix(value, signed)}${currencyFormatter(currency).format(value)}`;
    return {
      display,
      accessibleText: `${display} ${currency}`,
      title: `${display} ${currency}`,
      unitLabel: currency,
    };
  }

  if (unit === "percentage") {
    const display = `${signedPrefix(value, signed)}${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }).format(value * 100)}%`;
    return {
      display,
      accessibleText: display,
      title: display,
      unitLabel: "Percentage",
    };
  }

  if (unit === "multiple") {
    const display = `${signedPrefix(value, signed)}${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(value)}x`;
    return {
      display,
      accessibleText: display,
      title: display,
      unitLabel: "Multiple",
    };
  }

  if (unit === "days") {
    const display = `${signedPrefix(value, signed)}${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }).format(value)} days`;
    return {
      display,
      accessibleText: display,
      title: display,
      unitLabel: "Days",
    };
  }

  if (unit === "score-change") {
    const display = `${signedPrefix(value, signed)}${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }).format(value)} pts`;
    return {
      display,
      accessibleText: display,
      title: display,
      unitLabel: "Points",
    };
  }

  const display = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);

  return {
    display,
    accessibleText: `${display} out of 100`,
    title: `${display} out of 100`,
    unitLabel: "Score",
  };
}

export function formatCoverage(value: number) {
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value)}%`;
}
