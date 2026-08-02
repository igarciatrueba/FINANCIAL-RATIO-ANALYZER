"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Circle, Info, RotateCcw, Save, Upload } from "lucide-react";
import { get, useForm, useWatch, type FieldPath } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  issues,
  onStepChange,
}: {
  currentStep: WorkflowStepId;
  completedSteps: Set<WorkflowStepId>;
  issues: ValidationIssue[];
  onStepChange: (step: WorkflowStepId) => void;
}) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 py-3">
      <div aria-label="Compact workflow progress" className="mb-3 text-caption font-semibold uppercase text-neutral-400 md:hidden">
        Step {currentIndex + 1} of {workflowSteps.length}: {sectionLabels[currentStep]}
      </div>
      <nav aria-label="Financial input workflow">
        <ol className="grid gap-2 md:grid-cols-6">
          {workflowSteps.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const hasError = issueCountForStep(issues, step.id) > 0;
            const isComplete = completedSteps.has(step.id) && !hasError;
            const stateLabel = hasError ? "error" : isCurrent ? "current" : isComplete ? "completed" : "incomplete";
            const Icon = hasError ? AlertTriangle : isComplete ? CheckCircle2 : Circle;

            return (
              <li key={step.id}>
                <button
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-small font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    isCurrent && "border-primary bg-primary/10 text-neutral-50",
                    !isCurrent && !hasError && "border-border bg-surface text-neutral-300 hover:bg-surface-elevated",
                    hasError && "border-danger/60 bg-danger/10 text-neutral-50"
                  )}
                  onClick={() => onStepChange(step.id)}
                  type="button"
                >
                  <Icon
                    aria-hidden="true"
                    className={cn("h-4 w-4", hasError ? "text-danger" : isComplete ? "text-success" : "text-primary")}
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{step.label}</span>
                    <span className="block text-caption font-medium text-neutral-400">{stateLabel}</span>
                  </span>
                  <span className="sr-only">{index + 1}</span>
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
}: {
  register: ReturnType<typeof useForm<FinancialInputFormValues>>["register"];
  errors: unknown;
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
                </FieldShell>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
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
}: {
  errors: unknown;
  register: ReturnType<typeof useForm<FinancialInputFormValues>>["register"];
  step: FinancialSectionId;
  years: string[];
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

                  return (
                    <FieldShell
                      error={error}
                      helperText={periodIndex === 0 ? field.helperText : undefined}
                      id={id}
                      key={path}
                      label={`${field.label} ${yearLabel}`}
                    >
                      <input
                        {...register(path, {
                          validate: (value) => validatePlainNumberField(String(value)),
                        })}
                        aria-describedby={`${id}-error`}
                        aria-invalid={Boolean(error)}
                        className="min-h-12 rounded-md border border-border bg-surface px-4 py-3 text-body text-neutral-50"
                        id={id}
                        inputMode="decimal"
                        type="number"
                      />
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
  const suppressNextAutosaveRef = useRef(false);
  const [autosaveReady, setAutosaveReady] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStepId>("company");
  const [completedSteps, setCompletedSteps] = useState<Set<WorkflowStepId>>(new Set());
  const [hasLoadedDemo, setHasLoadedDemo] = useState(false);
  const [draftStatus, setDraftStatus] = useState("Local draft only");

  const form = useForm<FinancialInputFormValues>({
    defaultValues: createEmptyFinancialInputForm(),
    mode: "onBlur",
  });
  const { control, formState, getValues, register, reset, trigger } = form;
  const watchedValues = useWatch({ control });
  const values = getValues();
  const transformResult = transformFormValuesToCanonical(values);
  const acceptedInput: FinancialAnalysisInput | null = transformResult.success ? transformResult.data : null;
  const relationshipFeedback = createFinancialValidationFeedback(acceptedInput, hasLoadedDemo);
  const reviewFeedback = combineFeedback(transformResult.success ? [] : transformResult.validation.issues, relationshipFeedback);
  const years = values.periods.map((period) => period.year);
  const currentIndex = getStepIndex(currentStep);
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
    setDraftStatus("Demo loaded into editable local draft");
  }

  function resetForm() {
    suppressNextAutosaveRef.current = true;
    reset(createEmptyFinancialInputForm());
    setHasLoadedDemo(false);
    setCompletedSteps(new Set());
    setCurrentStep("company");
    window.localStorage.removeItem(INPUT_DRAFT_STORAGE_KEY);
    setDraftStatus("Local draft cleared");
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
    router.push("/analysis");
  }

  const navigationIssues = useMemo(
    () => [...reviewFeedback.errors, ...reviewFeedback.warnings],
    [reviewFeedback.errors, reviewFeedback.warnings]
  );

  return (
    <div className="grid gap-6">
      <section aria-label="Demo companies" className="rounded-md border border-border bg-surface p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-small font-semibold text-neutral-50">Start from a fictional company or enter data manually.</p>
            <p className="mt-1 text-caption text-neutral-400">
              Local draft persistence only. Data is not synced to any cloud service.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {demoCompanies.map((demo) => (
              <Button
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

      <WorkflowNavigation
        completedSteps={completedSteps}
        currentStep={currentStep}
        issues={navigationIssues}
        onStepChange={goToStep}
      />

      <form className="grid gap-6" noValidate onChange={resumeAutosave}>
        {currentStep === "company" ? <CompanyStep errors={formState.errors} register={register} /> : null}
        {currentStep !== "company" && currentStep !== "review" ? (
          <FinancialSectionStep
            errors={formState.errors}
            register={register}
            step={currentStep}
            years={years}
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
              <Button disabled={!canAnalyse} onClick={analyseCompany} type="button">
                Analyse company
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
