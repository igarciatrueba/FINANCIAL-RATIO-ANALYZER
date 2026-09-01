"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Circle, FileCheck2, Info, RotateCcw, Save, Upload } from "lucide-react";
import { get, useForm, useWatch, type FieldPath } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { persistFinancialInputAction, resolveAnnualReportDraftFieldAction } from "@/app/workspace/actions";
import { useAccountSession } from "@/features/accounts/auth-session-provider";
import { AnnualReportUpload } from "@/features/annual-report-ingestion/components/annual-report-upload";
import { applyAnnualReportReviewDraft, type ReviewFieldByFormPath } from "@/features/annual-report-ingestion/lib/apply-review-draft";
import type { AnnualReportReviewDraft } from "@/features/annual-report-ingestion/review-types";
import { PERSISTED_ANALYSIS_CONTEXT_KEY } from "@/features/accounts/persisted-analysis-context";
import type { FinancialAnalysisInput, ValidationIssue } from "@/domain";
import { demoCompanies, cloneDemoCompany, type DemoCompanyId } from "@/features/financial-input/demo-companies";
import {
  financialFieldGroups,
  getNextStep,
  getPreviousStep,
  getStepIndex,
  sectionLabels,
  workflowSteps,
} from "@/features/financial-input/field-metadata";
import {
  createEmptyFinancialInputForm,
  financialInputToFormValues,
  transformFormValuesToCanonical,
} from "@/features/financial-input/form-transform";
import { parseIntegerString, parsePlainNumber } from "@/features/financial-input/numeric-parser";
import {
  ACTIVE_ANALYSIS_STORAGE_KEY,
  INPUT_DRAFT_STORAGE_KEY,
  buildActiveAnalysisSession,
  buildInputDraft,
  recoverInputDraft,
  serializeActiveAnalysisSession,
  serializeInputDraft,
} from "@/features/financial-input/persistence";
import type {
  FinancialInputFormValues,
  FinancialSectionId,
  ValidationFeedback,
  WorkflowStepId,
} from "@/features/financial-input/types";
import { createFinancialValidationFeedback } from "@/features/financial-input/validation";
import { cn } from "@/lib/utils";

type PeriodSectionKey = "incomeStatement" | "balanceSheet" | "cashFlow" | "workingCapital";

const sectionToPeriodKey: Record<FinancialSectionId, PeriodSectionKey> = {
  "income-statement": "incomeStatement",
  "balance-sheet": "balanceSheet",
  "cash-flow": "cashFlow",
  "working-capital": "workingCapital",
};

function pathForIssue(issue: ValidationIssue) {
  if (issue.path.includes("incomeStatement")) {
    return "income-statement";
  }
  if (issue.path.includes("balanceSheet")) {
    return "balance-sheet";
  }
  if (issue.path.includes("cashFlow")) {
    return "cash-flow";
  }
  if (issue.path.includes("workingCapital")) {
    return "working-capital";
  }
  if (issue.path === "periods" || issue.path.includes(".year") || issue.path.startsWith("company")) {
    return "company";
  }
  return "review";
}

function fieldPath(step: FinancialSectionId, periodIndex: number, key: string) {
  return `periods.${periodIndex}.${sectionToPeriodKey[step]}.${key}` as FieldPath<FinancialInputFormValues>;
}

function stepFieldPaths(step: WorkflowStepId): Array<FieldPath<FinancialInputFormValues>> {
  if (step === "company") {
    return [
      "company.name",
      "company.industry",
      "company.currency",
      "periods.0.year",
      "periods.1.year",
      "periods.2.year",
    ];
  }

  if (step === "review") {
    return [];
  }

  return financialFieldGroups[step].flatMap((field) =>
    [0, 1, 2].map((periodIndex) => fieldPath(step, periodIndex, field.key))
  );
}

function validatePlainNumberField(value: string) {
  const result = parsePlainNumber(value);
  return result.success || result.message;
}

function validateYearField(value: string, label: string) {
  const result = parseIntegerString(value, label);
  return result.success || result.message;
}

function fieldError(errors: unknown, path: string) {
  const error = get(errors, path) as { message?: string } | undefined;
  return error?.message;
}

function issueCountForStep(issues: ValidationIssue[], step: WorkflowStepId) {
  return issues.filter((issue) => pathForIssue(issue) === step).length;
}

function combineFeedback(errors: ValidationIssue[], feedback: ValidationFeedback): ValidationFeedback {
  return {
    errors,
    warnings: feedback.warnings,
    infos: feedback.infos,
  };
}

function readInitialDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  const serialized = window.localStorage.getItem(INPUT_DRAFT_STORAGE_KEY);
  const recovered = recoverInputDraft(serialized);

  if (serialized && !recovered) {
    window.localStorage.removeItem(INPUT_DRAFT_STORAGE_KEY);
  }

  return recovered;
}

function WorkflowNavigation({
  currentStep,
  completedSteps,
  completedFieldCount,
  totalFieldCount,
  issues,
  onStepChange,
}: {
  currentStep: WorkflowStepId;
  completedSteps: Set<WorkflowStepId>;
  completedFieldCount: number;
  totalFieldCount: number;
  issues: ValidationIssue[];
  onStepChange: (step: WorkflowStepId) => void;
}) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="sticky top-20 z-30 border-b border-border bg-background/95 py-3 backdrop-blur-xl md:top-24">
      <div aria-label="Compact workflow progress" className="mb-3 flex items-center justify-between gap-3 md:hidden">
        <span className="text-caption font-semibold uppercase text-neutral-400">Step {currentIndex + 1} of {workflowSteps.length}: {sectionLabels[currentStep]}</span>
        <span aria-hidden="true" className="h-1.5 w-20 overflow-hidden rounded-full bg-surface"><span className="block h-full bg-primary" style={{ width: `${((currentIndex + 1) / workflowSteps.length) * 100}%` }} /></span>
      </div>
      {totalFieldCount > 0 ? <p className="mb-3 text-caption text-neutral-400"><span className="font-mono font-semibold text-blue-200">{completedFieldCount} / {totalFieldCount}</span> fields completed in this section</p> : null}
      <nav aria-label="Financial input workflow">
        <ol className="input-progress-timeline hidden gap-0 md:grid md:grid-cols-6">
          {workflowSteps.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const hasError = issueCountForStep(issues, step.id) > 0;
            const isComplete = completedSteps.has(step.id) && !hasError;
            const stateLabel = hasError ? "error" : isCurrent ? "current" : isComplete ? "completed" : "incomplete";
            const Icon = hasError ? AlertTriangle : isComplete ? CheckCircle2 : Circle;

            return (
              <li className="relative min-w-0" key={step.id}>
                <button
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn("input-progress-step relative z-10 flex min-h-20 w-full flex-col items-center gap-1 px-2 py-1 text-center text-small font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", isCurrent && "text-neutral-50", !isCurrent && !hasError && "text-neutral-300 hover:text-neutral-50", hasError && "text-neutral-50")}
                  onClick={() => onStepChange(step.id)}
                  type="button"
                >
                  <span className={cn("input-progress-node", isCurrent && "is-current", isComplete && "is-complete", hasError && "is-error")}><Icon aria-hidden="true" className={cn("h-4 w-4", hasError ? "text-danger" : isComplete ? "text-success" : "text-primary")} /></span>
                  <span className="min-w-0"><span aria-hidden="true" className="font-mono text-caption text-neutral-500">0{index + 1}</span><span className="ml-1 leading-tight">{step.label}</span>
                    <span className="block text-caption font-medium text-neutral-400">{stateLabel}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

function CompanyStep({
  register,
  errors,
  periodSlots,
}: {
  register: ReturnType<typeof useForm<FinancialInputFormValues>>["register"];
  errors: unknown;
  periodSlots?: AnnualReportReviewDraft["periodSlots"];
}) {
  return (
    <Card>
      <CardHeader>
        <Badge>Step 1</Badge>
        <CardTitle>Company</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <FieldShell error={fieldError(errors, "company.name")} id="company-name" label="Company name">
            <input
              {...register("company.name", { required: "Company name is required." })}
              aria-describedby="company-name-error"
              aria-invalid={Boolean(fieldError(errors, "company.name"))}
              className="min-h-12 rounded-md border border-border bg-background px-4 py-3 text-body text-neutral-50"
              id="company-name"
              type="text"
            />
          </FieldShell>
          <FieldShell error={fieldError(errors, "company.industry")} id="company-industry" label="Industry">
            <input
              {...register("company.industry", { required: "Industry is required." })}
              aria-describedby="company-industry-error"
              aria-invalid={Boolean(fieldError(errors, "company.industry"))}
              className="min-h-12 rounded-md border border-border bg-background px-4 py-3 text-body text-neutral-50"
              id="company-industry"
              type="text"
            />
          </FieldShell>
          <FieldShell error={fieldError(errors, "company.currency")} id="company-currency" label="Currency">
            <select
              {...register("company.currency", { required: "Select a supported currency." })}
              aria-describedby="company-currency-error"
              aria-invalid={Boolean(fieldError(errors, "company.currency"))}
              className="min-h-12 rounded-md border border-border bg-background px-4 py-3 text-body text-neutral-50"
              id="company-currency"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </FieldShell>
        </div>

        <div className="mt-8">
          <p className="text-small font-semibold text-neutral-50">Reporting years</p>
          <p className="mt-1 text-small text-neutral-400">Use three annual reporting periods from oldest to newest.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((periodIndex) => {
              const label = `Reporting year ${periodIndex + 1}`;
              const path = `periods.${periodIndex}.year` as FieldPath<FinancialInputFormValues>;
              const id = `period-${periodIndex}-year`;
              const error = fieldError(errors, path);

              return (
                <FieldShell error={error} id={id} key={path} label={label}>
                  <input
                    {...register(path, {
                      validate: (value) => validateYearField(String(value), label),
                    })}
                    aria-describedby={`${id}-error`}
                    aria-invalid={Boolean(error)}
                    className="min-h-12 rounded-md border border-border bg-background px-4 py-3 text-body text-neutral-50"
                    id={id}
                    inputMode="numeric"
                    type="number"
                  />
                  {periodSlots ? (
                    <p className="text-caption text-neutral-500">
                      {periodSlots[periodIndex]?.fiscalPeriod ? `Extracted from PDF: ${periodSlots[periodIndex]?.fiscalPeriod?.label}` : "Requires manual input: no fiscal period was inferred."}
                    </p>
                  ) : null}
                </FieldShell>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function sourceDescription(field: NonNullable<ReviewFieldByFormPath[string]>) {
  const evidence = field.candidate?.sourceEvidence ?? null;
  const pageNumber = evidence && typeof evidence.pageNumber === "number" ? evidence.pageNumber : null;
  const label = evidence && typeof evidence.sourceLabel === "string" ? evidence.sourceLabel : null;
  const evidenceText = [label, pageNumber ? `page ${pageNumber}` : null].filter(Boolean).join(" · ");
  if (field.provenanceType === "USER_OVERRIDE") return evidenceText ? `User override. Original PDF evidence retained: ${evidenceText}.` : "User override. Original PDF evidence retained.";
  if (field.provenanceType === "USER_PROVIDED") return "User provided.";
  if (field.provenanceType === "DERIVED") return "Derived from documented PDF inputs.";
  if (field.provenanceType === "CONFLICT") return "Conflicting PDF evidence. Requires manual input.";
  if (field.provenanceType === "NOT_FOUND") return "Requires manual input.";
  return evidenceText ? `Extracted from PDF: ${evidenceText}.` : "Extracted from PDF.";
}

function ExtractionFieldNotice({
  field,
  onAccept,
}: {
  field?: ReviewFieldByFormPath[string];
  onAccept?: () => void;
}) {
  if (!field) return null;
  const requiresAcceptance = field.reviewState === "NEEDS_REVIEW" && field.candidate?.confidence === "medium" && field.formValue === null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-neutral-400">
      <FileCheck2 aria-hidden="true" className="h-3.5 w-3.5 text-blue-200" />
      <span>{sourceDescription(field)}</span>
      {requiresAcceptance ? (
        <button className="font-semibold text-blue-100 underline decoration-blue-300/40 underline-offset-2 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={onAccept} type="button">
          Use suggested PDF value
        </button>
      ) : null}
    </div>
  );
}

function FieldShell({
  children,
  error,
  helperText,
  id,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  helperText?: string;
  id: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-small font-semibold text-neutral-50" htmlFor={id}>
        {label}
      </label>
      {children}
      {helperText ? <p className="text-caption text-neutral-400">{helperText}</p> : null}
      {error ? (
        <p className="text-caption text-danger" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FinancialSectionStep({
  errors,
  register,
  step,
  years,
  reviewFields,
  onAcceptCandidate,
  onManualValue,
}: {
  errors: unknown;
  register: ReturnType<typeof useForm<FinancialInputFormValues>>["register"];
  step: FinancialSectionId;
  years: string[];
  reviewFields?: ReviewFieldByFormPath;
  onAcceptCandidate?: (path: string) => void;
  onManualValue?: (path: string, value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <Badge>Financial input</Badge>
        <CardTitle>{sectionLabels[step]}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-6 max-w-[760px] text-small text-neutral-400">
          Enter plain numbers without currency symbols or thousands separators. Negative values are accepted where the
          financial situation requires them.
        </p>
        <div className="grid gap-5">
          <div className="hidden grid-cols-[minmax(12rem,1fr)_repeat(3,minmax(0,1fr))] gap-4 border-b border-border pb-3 text-caption font-semibold uppercase tracking-[0.08em] text-neutral-400 md:grid"><span>Financial concept</span>{years.map((year, index) => <span key={`${year}-${index}`}>{year.trim() || `Period ${index + 1}`} <span className="block font-normal text-neutral-500">{index === 0 ? "Prior 2" : index === 1 ? "Prior" : "Current"}</span></span>)}</div>
          {financialFieldGroups[step].map((field) => (
            <fieldset
              className="rounded-md border border-border bg-background p-4"
              key={field.key}
              role="group"
              aria-label={field.label}
            >
              <legend className="px-1 text-small font-semibold text-neutral-50">{field.label}</legend>
              <p className="mt-1 text-caption text-neutral-400">{field.description}</p>
              {field.helperText ? <p className="mt-1 text-caption text-information">{field.helperText}</p> : null}
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {[0, 1, 2].map((periodIndex) => {
                  const yearLabel = years[periodIndex]?.trim() || `Period ${periodIndex + 1}`;
                  const path = fieldPath(step, periodIndex, field.key);
                  const id = `${step}-${field.key}-${periodIndex}`;
                  const error = fieldError(errors, path);
                  const reviewField = reviewFields?.[path];

                  return (
                    <FieldShell
                      error={error}
                      helperText={periodIndex === 0 ? field.helperText : undefined}
                      id={id}
                      key={path}
                      label={`${field.label} ${yearLabel}${periodIndex === 0 ? " (Prior 2)" : periodIndex === 1 ? " (Prior)" : " (Current)"}`}
                    >
                      <input
                        {...register(path, {
                          validate: (value) => validatePlainNumberField(String(value)),
                          onBlur: (event) => onManualValue?.(path, String(event.target.value)),
                        })}
                        aria-describedby={`${id}-error`}
                        aria-invalid={Boolean(error)}
                        className="min-h-12 rounded-md border border-border bg-surface px-4 py-3 text-body text-neutral-50"
                        id={id}
                        inputMode="decimal"
                        type="number"
                      />
                      <ExtractionFieldNotice field={reviewField} onAccept={reviewField ? () => onAcceptCandidate?.(path) : undefined} />
                    </FieldShell>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ValidationGroup({
  issues,
  label,
  onIssueAction,
  variant,
}: {
  issues: ValidationIssue[];
  label: string;
  onIssueAction: (step: WorkflowStepId) => void;
  variant: "danger" | "warning" | "info";
}) {
  const iconClassName = variant === "danger" ? "text-danger" : variant === "warning" ? "text-warning" : "text-information";
  const Icon = variant === "info" ? Info : AlertTriangle;

  return (
    <section aria-label={label} className="rounded-md border border-border bg-background p-5">
      <div className="flex items-center gap-2">
        <Icon aria-hidden="true" className={cn("h-5 w-5", iconClassName)} />
        <h3 className="text-h4 font-semibold leading-[1.25] text-neutral-50">{label}</h3>
        <Badge variant={variant}>{issues.length}</Badge>
      </div>
      {issues.length === 0 ? (
        <p className="mt-4 text-small text-neutral-400">No items in this group.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {issues.map((issue) => (
            <li className="rounded-sm border border-border bg-surface p-4" key={issue.id}>
              <p className="text-small font-semibold text-neutral-50">{issue.message}</p>
              {issue.suggestion ? <p className="mt-1 text-small text-neutral-400">{issue.suggestion}</p> : null}
              <button
                className="mt-3 text-small font-semibold text-primary hover:text-information"
                onClick={() => onIssueAction(pathForIssue(issue))}
                type="button"
              >
                Go to {sectionLabels[pathForIssue(issue)]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewStep({
  feedback,
  onIssueAction,
}: {
  feedback: ValidationFeedback;
  onIssueAction: (step: WorkflowStepId) => void;
}) {
  const reviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    reviewRef.current?.focus();
  }, []);

  return (
    <div ref={reviewRef} tabIndex={-1}>
      <Card>
        <CardHeader>
          <Badge>Validation review</Badge>
          <CardTitle>Review</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-[760px] text-small text-neutral-300">
            Blocking errors must be corrected before analysis. Warnings describe unusual but potentially valid financial
            data and do not block the handoff.
          </p>
          <div className="mt-6 grid gap-4">
            <ValidationGroup
              issues={feedback.errors}
              label="Blocking errors"
              onIssueAction={onIssueAction}
              variant="danger"
            />
            <ValidationGroup issues={feedback.warnings} label="Warnings" onIssueAction={onIssueAction} variant="warning" />
            <ValidationGroup issues={feedback.infos} label="Information" onIssueAction={onIssueAction} variant="info" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function FinancialInputWorkflow() {
  const router = useRouter();
  const accountSession = useAccountSession();
  const suppressNextAutosaveRef = useRef(false);
  const [autosaveReady, setAutosaveReady] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStepId>("company");
  const [completedSteps, setCompletedSteps] = useState<Set<WorkflowStepId>>(new Set());
  const [hasLoadedDemo, setHasLoadedDemo] = useState(false);
  const [draftStatus, setDraftStatus] = useState("Local draft only");
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [isPersistingAnalysis, setIsPersistingAnalysis] = useState(false);
  const [annualReportDraft, setAnnualReportDraft] = useState<AnnualReportReviewDraft | null>(null);
  const [reviewFields, setReviewFields] = useState<ReviewFieldByFormPath>({});

  const form = useForm<FinancialInputFormValues>({
    defaultValues: createEmptyFinancialInputForm(),
    mode: "onBlur",
  });
  const { control, formState, getValues, register, reset, setValue, trigger } = form;
  const watchedValues = useWatch({ control });
  const values = getValues();
  const transformResult = transformFormValuesToCanonical(values);
  const acceptedInput: FinancialAnalysisInput | null = transformResult.success ? transformResult.data : null;
  const relationshipFeedback = createFinancialValidationFeedback(acceptedInput, hasLoadedDemo);
  const reviewFeedback = combineFeedback(transformResult.success ? [] : transformResult.validation.issues, relationshipFeedback);
  const years = values.periods.map((period) => period.year);
  const currentIndex = getStepIndex(currentStep);
  const currentFieldPaths = stepFieldPaths(currentStep);
  const completedFieldCount = currentFieldPaths.filter((path) => String(get(values, path) ?? "").trim().length > 0).length;
  const isReview = currentStep === "review";
  const canAnalyse = isReview && reviewFeedback.errors.length === 0 && transformResult.success;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const recovered = readInitialDraft();

      if (recovered) {
        reset(recovered.values);
        setCurrentStep(recovered.activeStep);
        setDraftStatus("Draft restored from this browser");
        setAutosaveReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [reset]);

  useEffect(() => {
    if (!autosaveReady || suppressNextAutosaveRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(INPUT_DRAFT_STORAGE_KEY, serializeInputDraft(buildInputDraft(getValues(), currentStep)));
      setDraftStatus("Draft saved locally");
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [autosaveReady, currentStep, getValues, watchedValues]);

  function resumeAutosave() {
    suppressNextAutosaveRef.current = false;
    setAutosaveReady(true);
  }

  async function goToStep(step: WorkflowStepId) {
    resumeAutosave();
    if (step === "review") {
      await trigger();
    }
    setCurrentStep(step);
  }

  async function saveAndContinue() {
    resumeAutosave();
    const paths = stepFieldPaths(currentStep);
    const valid = paths.length === 0 ? true : await trigger(paths, { shouldFocus: true });

    if (!valid) {
      return;
    }

    setCompletedSteps((previous) => new Set(previous).add(currentStep));
    const nextStep = getNextStep(currentStep);
    if (nextStep === "review") {
      await trigger();
    }
    setCurrentStep(nextStep);
  }

  function goBack() {
    resumeAutosave();
    setCurrentStep(getPreviousStep(currentStep));
  }

  function loadDemo(id: DemoCompanyId) {
    resumeAutosave();
    reset(financialInputToFormValues(cloneDemoCompany(id)));
    setHasLoadedDemo(true);
    setCompletedSteps(new Set(["company"]));
    setCurrentStep("company");
    setAnnualReportDraft(null);
    setReviewFields({});
    setDraftStatus("Demo loaded into editable local draft");
  }

  function resetForm() {
    suppressNextAutosaveRef.current = true;
    reset(createEmptyFinancialInputForm());
    setHasLoadedDemo(false);
    setCompletedSteps(new Set());
    setCurrentStep("company");
    setAnnualReportDraft(null);
    setReviewFields({});
    window.localStorage.removeItem(INPUT_DRAFT_STORAGE_KEY);
    setDraftStatus("Local draft cleared");
  }

  function applyAnnualReportDraft(draft: AnnualReportReviewDraft) {
    resumeAutosave();
    const applied = applyAnnualReportReviewDraft(getValues(), draft);
    reset(applied.values);
    setAnnualReportDraft(draft);
    setReviewFields(applied.fieldByFormPath);
    setHasLoadedDemo(false);
    setCompletedSteps(new Set());
    setCurrentStep("company");
    setDraftStatus("PDF extraction draft loaded for review");
  }

  async function acceptPdfSuggestion(path: string) {
    const field = reviewFields[path];
    if (!annualReportDraft || !field) return;
    const result = await resolveAnnualReportDraftFieldAction(annualReportDraft.runId, {
      canonicalFieldKey: field.canonicalFieldKey,
      periodSlotIndex: field.periodSlotIndex,
      action: "accept_candidate",
    });
    if (!result.field) {
      setAnalysisStatus(result.error ?? "The PDF suggestion could not be accepted.");
      return;
    }
    const candidate = result.field.currentCandidateId ? annualReportDraft.candidates.find((item) => item.id === result.field?.currentCandidateId) ?? null : null;
    setValue(path as FieldPath<FinancialInputFormValues>, result.field.formValue ?? "", { shouldDirty: true, shouldValidate: true });
    setReviewFields((previous) => ({ ...previous, [path]: { ...result.field!, candidate } }));
    setDraftStatus("PDF suggestion accepted and saved to the private review draft");
  }

  async function recordManualPdfValue(path: string, value: string) {
    const field = reviewFields[path];
    if (!annualReportDraft || !field || !value.trim() || value.trim() === field.formValue) return;
    const result = await resolveAnnualReportDraftFieldAction(annualReportDraft.runId, {
      canonicalFieldKey: field.canonicalFieldKey,
      periodSlotIndex: field.periodSlotIndex,
      action: "provide_value",
      value: value.trim(),
    });
    if (!result.field) {
      setAnalysisStatus(result.error ?? "The reviewed PDF value could not be saved.");
      return;
    }
    const candidateId = result.field.currentCandidateId ?? result.field.originalCandidateId;
    const candidate = candidateId ? annualReportDraft.candidates.find((item) => item.id === candidateId) ?? null : null;
    setReviewFields((previous) => ({ ...previous, [path]: { ...result.field!, candidate } }));
    setDraftStatus("Manual PDF review value saved with its original evidence");
  }

  async function analyseCompany() {
    await trigger();
    const latest = transformFormValuesToCanonical(getValues());

    if (!latest.success) {
      setCurrentStep("review");
      return;
    }

    const feedback = createFinancialValidationFeedback(latest.data, hasLoadedDemo);
    if (feedback.errors.length > 0) {
      setCurrentStep("review");
      return;
    }

    window.sessionStorage.setItem(
      ACTIVE_ANALYSIS_STORAGE_KEY,
      serializeActiveAnalysisSession(buildActiveAnalysisSession(latest.data))
    );

    if (accountSession.status === "authenticated") {
      setAnalysisStatus(null);
      setIsPersistingAnalysis(true);
      const persisted = await persistFinancialInputAction(latest.data);
      setIsPersistingAnalysis(false);
      if (!persisted.runId) {
        setAnalysisStatus(persisted.error ?? "Your analysis could not be saved to the workspace. Retry to preserve its history.");
        return;
      }
      window.sessionStorage.setItem(PERSISTED_ANALYSIS_CONTEXT_KEY, JSON.stringify({ runId: persisted.runId, companyId: persisted.companyId, datasetVersionId: persisted.datasetVersionId }));
      router.push(`/workspace/analyses/${persisted.runId}`);
      return;
    }
    router.push("/analysis");
  }

  const navigationIssues = useMemo(
    () => (formState.isDirty || isReview ? [...reviewFeedback.errors, ...reviewFeedback.warnings] : []),
    [formState.isDirty, isReview, reviewFeedback.errors, reviewFeedback.warnings]
  );

  return (
    <div className="premium-workspace grid gap-8 premium-enter">
      <section aria-label="Demo companies" className="premium-panel rounded-lg p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="premium-kicker">Starting point</p><p className="mt-2 text-h4 font-semibold text-neutral-50">Start from a fictional company or enter data manually.</p>
            <p className="mt-1 text-caption text-neutral-400">
              {accountSession.status === "authenticated" ? "Signed in: completed analysis is saved as an immutable workspace record." : "Local draft persistence only. Sign in when you want to save analysis history."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {demoCompanies.map((demo) => (
              <Button
                className="w-full whitespace-normal px-3 text-center text-small sm:w-auto sm:px-5"
                key={demo.company.id}
                onClick={() => loadDemo(demo.company.id)}
                type="button"
                variant="secondary"
              >
                <Upload aria-hidden="true" className="h-5 w-5" />
                Load {demo.company.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <AnnualReportUpload onDraftReady={applyAnnualReportDraft} session={accountSession} />

      <WorkflowNavigation
        completedFieldCount={completedFieldCount}
        completedSteps={completedSteps}
        currentStep={currentStep}
        issues={navigationIssues}
        onStepChange={goToStep}
        totalFieldCount={currentFieldPaths.length}
      />

      <form className="grid gap-8" noValidate onChange={resumeAutosave}>
        {currentStep === "company" ? <CompanyStep errors={formState.errors} periodSlots={annualReportDraft?.periodSlots} register={register} /> : null}
        {currentStep !== "company" && currentStep !== "review" ? (
          <FinancialSectionStep
            errors={formState.errors}
            register={register}
            step={currentStep}
            years={years}
            reviewFields={reviewFields}
            onAcceptCandidate={(path) => void acceptPdfSuggestion(path)}
            onManualValue={(path, value) => void recordManualPdfValue(path, value)}
          />
        ) : null}
        {currentStep === "review" ? <ReviewStep feedback={reviewFeedback} onIssueAction={setCurrentStep} /> : null}

        <div className="flex flex-col gap-3 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-caption text-neutral-400" role="status">
            <Save aria-hidden="true" className="h-4 w-4 text-primary" />
            <span>{draftStatus}</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={resetForm} type="button" variant="ghost">
              <RotateCcw aria-hidden="true" className="h-5 w-5" />
              Reset form
            </Button>
            {currentIndex > 0 ? (
              <Button onClick={goBack} type="button" variant="secondary">
                Back
              </Button>
            ) : null}
            {currentStep !== "review" ? (
              <Button onClick={saveAndContinue} type="button">
                Save and continue
              </Button>
            ) : (
              <Button disabled={!canAnalyse || isPersistingAnalysis} onClick={analyseCompany} type="button">
                {isPersistingAnalysis ? "Saving analysis" : accountSession.status === "authenticated" ? "Save and analyse" : "Analyse company"}
              </Button>
            )}
          </div>
        </div>
        {analysisStatus ? <p className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-small text-red-100" role="alert">{analysisStatus}</p> : null}
      </form>
    </div>
  );
}
