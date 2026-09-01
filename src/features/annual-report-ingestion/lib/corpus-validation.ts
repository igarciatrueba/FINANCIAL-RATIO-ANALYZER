import { canonicalFinancialFieldKeys, type CanonicalFieldKey, type FiscalPeriodIdentity, type StatementSource } from "@/features/annual-report-ingestion/types";

export type GroundTruthClassification = "PRESENT_DIRECT" | "PRESENT_DERIVABLE" | "NOT_PRESENT" | "AMBIGUOUS";

type GroundTruthBase = {
  canonicalFieldKey: CanonicalFieldKey;
  periodSlotIndex: 0 | 1 | 2;
};

export type DirectGroundTruthValue = GroundTruthBase & {
  classification: "PRESENT_DIRECT";
  canonicalValue: string;
  fiscalPeriod: FiscalPeriodIdentity;
  currency: "EUR" | "USD" | "GBP";
  scale: "units" | "thousands" | "millions" | "billions";
  sourcePage: number;
  sourceStatement: StatementSource;
  sourceLabel: string;
  sourceValue?: string;
  normalization?: string;
};

export type DerivableGroundTruthValue = GroundTruthBase & {
  classification: "PRESENT_DERIVABLE";
  canonicalValue: string;
  fiscalPeriod: FiscalPeriodIdentity;
  currency: "EUR" | "USD" | "GBP";
  rule: string;
  components: readonly {
    sourcePage: number;
    sourceStatement: StatementSource;
    sourceLabel: string;
    sourceValue: string;
  }[];
};

export type UnavailableGroundTruthValue = GroundTruthBase & {
  classification: "NOT_PRESENT" | "AMBIGUOUS";
  reason: string;
};

export type GroundTruthValue = DirectGroundTruthValue | DerivableGroundTruthValue | UnavailableGroundTruthValue;

export type CorpusGroundTruth = {
  defaultClassification: "NOT_PRESENT";
  values: readonly GroundTruthValue[];
};

export type MaterializedGroundTruthValue = GroundTruthValue & { key: string };

type ExtractionDraftFieldForValidation = {
  canonicalFieldKey: CanonicalFieldKey;
  periodSlotIndex: 0 | 1 | 2;
  formValue: string | null;
  candidateReference: string | null;
  reviewState: "UNREVIEWED" | "NEEDS_REVIEW" | "USER_CONFIRMED";
};

type ExtractionCandidateForValidation = {
  reference: string;
  normalizedValue: string | null;
  selectionStatus: "available" | "conflict" | "unresolved";
};

function toKey(canonicalFieldKey: CanonicalFieldKey, periodSlotIndex: number) {
  return `${canonicalFieldKey}:${periodSlotIndex}`;
}

function defaultUnavailableValue(canonicalFieldKey: CanonicalFieldKey, periodSlotIndex: 0 | 1 | 2): MaterializedGroundTruthValue {
  return {
    key: toKey(canonicalFieldKey, periodSlotIndex),
    canonicalFieldKey,
    periodSlotIndex,
    classification: "NOT_PRESENT",
    reason: "No semantically supportable source value was manually verified in this report for this canonical period slot.",
  };
}

function validateGroundTruthValue(value: GroundTruthValue) {
  if ((value.classification === "PRESENT_DIRECT" || value.classification === "PRESENT_DERIVABLE") && !value.canonicalValue) {
    throw new Error(`${toKey(value.canonicalFieldKey, value.periodSlotIndex)} requires a canonical value.`);
  }
  if (value.classification === "PRESENT_DIRECT" && (!value.sourcePage || !value.sourceLabel || !value.fiscalPeriod.label)) {
    throw new Error(`${toKey(value.canonicalFieldKey, value.periodSlotIndex)} requires direct PDF evidence.`);
  }
  if (value.classification === "PRESENT_DERIVABLE" && (!value.rule || value.components.length === 0 || !value.fiscalPeriod.label)) {
    throw new Error(`${toKey(value.canonicalFieldKey, value.periodSlotIndex)} requires a documented derivation.`);
  }
  if ((value.classification === "NOT_PRESENT" || value.classification === "AMBIGUOUS") && !value.reason) {
    throw new Error(`${toKey(value.canonicalFieldKey, value.periodSlotIndex)} requires an unavailable reason.`);
  }
}

export function materializeGroundTruth(groundTruth: CorpusGroundTruth): MaterializedGroundTruthValue[] {
  const values = new Map<string, MaterializedGroundTruthValue>();
  for (const canonicalFieldKey of canonicalFinancialFieldKeys) {
    for (const periodSlotIndex of [0, 1, 2] as const) {
      const value = defaultUnavailableValue(canonicalFieldKey, periodSlotIndex);
      values.set(value.key, value);
    }
  }

  for (const value of groundTruth.values) {
    validateGroundTruthValue(value);
    const key = toKey(value.canonicalFieldKey, value.periodSlotIndex);
    if (values.get(key)?.classification !== "NOT_PRESENT") {
      throw new Error(`Duplicate ground truth classification for ${key}.`);
    }
    values.set(key, { ...value, key });
  }

  return [...values.values()];
}

function isPresent(value: MaterializedGroundTruthValue): value is MaterializedGroundTruthValue & (DirectGroundTruthValue | DerivableGroundTruthValue) {
  return value.classification === "PRESENT_DIRECT" || value.classification === "PRESENT_DERIVABLE";
}

export function evaluateAnnualReportCorpusEntry(input: {
  groundTruth: CorpusGroundTruth;
  draftFields: readonly ExtractionDraftFieldForValidation[];
  candidates: readonly ExtractionCandidateForValidation[];
}) {
  const groundTruth = materializeGroundTruth(input.groundTruth);
  const truthByKey = new Map(groundTruth.map((value) => [value.key, value]));
  const candidatesByReference = new Map(input.candidates.map((candidate) => [candidate.reference, candidate]));
  const autoFilled = input.draftFields.filter((field) => field.formValue !== null);
  const correctAutoFilled = autoFilled.filter((field) => {
    const truth = truthByKey.get(toKey(field.canonicalFieldKey, field.periodSlotIndex));
    return truth !== undefined && isPresent(truth) && truth.canonicalValue === field.formValue;
  });
  const incorrect = autoFilled.filter((field) => {
    const truth = truthByKey.get(toKey(field.canonicalFieldKey, field.periodSlotIndex));
    return truth !== undefined && isPresent(truth) && truth.canonicalValue !== field.formValue;
  });
  const unsupported = autoFilled.filter((field) => {
    const truth = truthByKey.get(toKey(field.canonicalFieldKey, field.periodSlotIndex));
    return truth?.classification === "NOT_PRESENT" || truth?.classification === "AMBIGUOUS";
  });
  const correctlySuggested = input.draftFields.filter((field) => {
    if (field.formValue !== null || field.candidateReference === null) return false;
    const candidate = candidatesByReference.get(field.candidateReference);
    const truth = truthByKey.get(toKey(field.canonicalFieldKey, field.periodSlotIndex));
    return candidate?.selectionStatus === "available" && candidate.normalizedValue !== null && truth !== undefined && isPresent(truth) && candidate.normalizedValue === truth.canonicalValue;
  });
  const resolvedKeys = new Set([...correctAutoFilled, ...correctlySuggested].map((field) => toKey(field.canonicalFieldKey, field.periodSlotIndex)));
  const presentValues = groundTruth.filter(isPresent);

  return {
    canonicalValuesPresent: presentValues.length,
    autoFilled: autoFilled.length,
    correct: correctAutoFilled.length,
    needsReview: input.draftFields.filter((field) => field.formValue === null && field.candidateReference !== null).length,
    correctlyResolved: resolvedKeys.size,
    presentButMissed: presentValues.filter((value) => !resolvedKeys.has(value.key)).length,
    notPresent: groundTruth.filter((value) => value.classification === "NOT_PRESENT").length,
    ambiguous: groundTruth.filter((value) => value.classification === "AMBIGUOUS").length,
    incorrect: incorrect.length,
    unsupported: unsupported.length,
    precision: autoFilled.length === 0 ? null : correctAutoFilled.length / autoFilled.length,
    recall: presentValues.length === 0 ? null : resolvedKeys.size / presentValues.length,
  };
}
