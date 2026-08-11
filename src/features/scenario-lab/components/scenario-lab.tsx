"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3, BookOpen, FilePenLine, Gauge, RotateCcw } from "lucide-react";

import type { FinancialAnalysisInput, FinancialAnalysisResult, ScenarioAssumptions, ScenarioControlId, ScenarioPresetId } from "@/domain";
import { baseScenarioAssumptions, scenarioPresetList, scenarioPropagationRules } from "@/domain/scenarios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, useReducedMotionPreference } from "@/features/executive-dashboard/charts/chart-container";
import { formatFinancialValue } from "@/features/executive-dashboard/lib/format-financial-value";
import { buildScenarioDimensionComparisonOption } from "@/features/scenario-lab/charts/scenario-chart-options";
import {
  buildScenarioComparisonViewModel,
  runScenarioPipeline,
} from "@/features/scenario-lab/lib/build-scenario-comparison-view-model";
import type {
  ScenarioComparisonViewModel,
} from "@/features/scenario-lab/types/scenario.types";

type ScenarioLabProps = {
  baseInput: FinancialAnalysisInput;
  baseAnalysis: FinancialAnalysisResult;
  initialViewModel: ScenarioComparisonViewModel;
};

type ControlConfig = {
  id: ScenarioControlId;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  meaning: string;
};

const controls: ControlConfig[] = [
  {
    id: "revenueGrowthPercent",
    label: "Revenue growth",
    unit: "%",
    min: -99,
    max: 100,
    step: 1,
    meaning: "Changes latest-period revenue and preserves base gross and net revenue margins.",
  },
  {
    id: "ebitMarginPercent",
    label: "EBIT margin",
    unit: "%",
    min: -100,
    max: 100,
    step: 0.1,
    meaning: "Sets latest-period EBIT as a target percentage of scenario revenue.",
  },
  {
    id: "totalDebtChangePercent",
    label: "Total debt",
    unit: "%",
    min: -100,
    max: 100,
    step: 1,
    meaning: "Changes latest-period total debt without hidden cash or equity balancing.",
  },
  {
    id: "currentAssetsChangePercent",
    label: "Current assets",
    unit: "%",
    min: -100,
    max: 100,
    step: 1,
    meaning: "Changes latest-period current assets while preserving individual asset components.",
  },
  {
    id: "inventoryChangePercent",
    label: "Inventory change",
    unit: "%",
    min: -100,
    max: 100,
    step: 1,
    meaning: "Changes inventory and average inventory without assuming an equal cash movement.",
  },
  {
    id: "interestExpenseChangePercent",
    label: "Interest expense",
    unit: "%",
    min: -100,
    max: 100,
    step: 1,
    meaning: "Changes latest-period interest expense and applies a no-tax net-income passthrough.",
  },
];

function latestPeriod(input: FinancialAnalysisInput) {
  return input.periods[input.periods.length - 1];
}

function latestBaseValue(input: FinancialAnalysisInput, controlId: ScenarioControlId) {
  const period = latestPeriod(input);
  switch (controlId) {
    case "revenueGrowthPercent":
      return period.incomeStatement.revenue;
    case "ebitMarginPercent":
      return period.incomeStatement.revenue === 0 ? null : (period.incomeStatement.ebit / period.incomeStatement.revenue) * 100;
    case "totalDebtChangePercent":
      return period.balanceSheet.totalDebt;
    case "currentAssetsChangePercent":
      return period.balanceSheet.currentAssets;
    case "inventoryChangePercent":
      return period.balanceSheet.inventory;
    case "interestExpenseChangePercent":
      return period.incomeStatement.interestExpense;
  }
}

function controlInputValue(assumptions: ScenarioAssumptions, controlId: ScenarioControlId, baseInput: FinancialAnalysisInput) {
  const value = assumptions[controlId];
  if (controlId === "ebitMarginPercent" && value === null) {
    const baseMargin = latestBaseValue(baseInput, controlId);
    return baseMargin === null ? "" : Number(baseMargin.toFixed(2));
  }

  if (typeof value === "number" && !Number.isFinite(value)) {
    return "";
  }

  return value ?? "";
}

function assumptionsEqual(left: ScenarioAssumptions, right: ScenarioAssumptions) {
  return (
    left.revenueGrowthPercent === right.revenueGrowthPercent &&
    left.ebitMarginPercent === right.ebitMarginPercent &&
    left.totalDebtChangePercent === right.totalDebtChangePercent &&
    left.currentAssetsChangePercent === right.currentAssetsChangePercent &&
    left.inventoryChangePercent === right.inventoryChangePercent &&
    left.interestExpenseChangePercent === right.interestExpenseChangePercent
  );
}

function presetIdForAssumptions(assumptions: ScenarioAssumptions): ScenarioPresetId | null {
  return scenarioPresetList.find((preset) => assumptionsEqual(preset.assumptions, assumptions))?.id ?? null;
}

function selectPresetLabel(selectedPresetId: ScenarioPresetId | "custom" | null) {
  if (selectedPresetId === "custom") {
    return "Custom";
  }

  if (selectedPresetId === null) {
    return "Base Case";
  }

  return scenarioPresetList.find((preset) => preset.id === selectedPresetId)?.name ?? "Custom";
}

function selectedPresetForComparison(selectedPresetId: ScenarioPresetId | "custom" | null) {
  return selectedPresetId;
}

function buildViewModelFromPipeline(
  baseInput: FinancialAnalysisInput,
  baseAnalysis: FinancialAnalysisResult,
  assumptions: ScenarioAssumptions,
  selectedPresetId: ScenarioPresetId | "custom" | null,
  initialViewModel: ScenarioComparisonViewModel
) {
  if (assumptionsEqual(assumptions, baseScenarioAssumptions) && selectedPresetId === null) {
    return {
      status: "success" as const,
      input: baseInput,
      analysis: baseAnalysis,
      metadata: {
        latestYear: latestPeriod(baseInput).year,
        changedFields: [],
        propagationRules: scenarioPropagationRules,
      },
      viewModel: initialViewModel,
    };
  }

  const pipeline = runScenarioPipeline(baseInput, assumptions);
  if (pipeline.status !== "success") {
    return pipeline;
  }

  return {
    ...pipeline,
    viewModel: buildScenarioComparisonViewModel({
      baseInput,
      baseAnalysis,
      scenarioInput: pipeline.input,
      scenarioAnalysis: pipeline.analysis,
      assumptions,
      metadata: pipeline.metadata,
      selectedPresetId: selectedPresetForComparison(selectedPresetId),
    }),
  };
}

export function ScenarioLab({ baseInput, baseAnalysis, initialViewModel }: ScenarioLabProps) {
  const reducedMotion = useReducedMotionPreference();
  const [assumptions, setAssumptions] = useState<ScenarioAssumptions>(baseScenarioAssumptions);
  const [selectedPresetId, setSelectedPresetId] = useState<ScenarioPresetId | "custom" | null>(null);
  const state = useMemo(
    () => buildViewModelFromPipeline(baseInput, baseAnalysis, assumptions, selectedPresetId, initialViewModel),
    [assumptions, baseAnalysis, baseInput, initialViewModel, selectedPresetId]
  );
  const viewModel = state.status === "success" ? state.viewModel : initialViewModel;
  const isBaseCase = assumptionsEqual(assumptions, baseScenarioAssumptions);
  const selectedPreset =
    selectedPresetId && selectedPresetId !== "custom"
      ? scenarioPresetList.find((candidate) => candidate.id === selectedPresetId)
      : undefined;

  function updateControl(controlId: ScenarioControlId, rawValue: string) {
    const nextValue = rawValue === "" ? Number.NaN : Number(rawValue);
    const nextAssumptions = {
      ...assumptions,
      [controlId]: controlId === "ebitMarginPercent" ? nextValue : nextValue,
    };
    const matchingPreset = presetIdForAssumptions(nextAssumptions);
    setAssumptions(nextAssumptions);
    setSelectedPresetId(matchingPreset ?? (assumptionsEqual(nextAssumptions, baseScenarioAssumptions) ? null : "custom"));
  }

  function applyPreset(value: string) {
    if (value === "base") {
      setAssumptions(baseScenarioAssumptions);
      setSelectedPresetId(null);
      return;
    }

    const preset = scenarioPresetList.find((candidate) => candidate.id === value);
    if (preset) {
      setAssumptions(preset.assumptions);
      setSelectedPresetId(preset.id);
    }
  }

  function resetScenario() {
    setAssumptions(baseScenarioAssumptions);
    setSelectedPresetId(null);
  }

  return (
    <div className="premium-workspace grid min-w-0 gap-8 premium-enter">
      <ScenarioContextBar isBaseCase={isBaseCase} viewModel={viewModel} selectedPresetId={selectedPresetId} />

      {isBaseCase ? <BaseCaseState viewModel={viewModel} /> : null}

      <section aria-label="Scenario setup" className="premium-panel rounded-lg p-5 md:p-7">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <p className="premium-kicker">Scenario setup</p>
            <label className="mt-2 block text-small font-semibold text-neutral-50" htmlFor="scenario-preset">
              Preset scenario
            </label>
            <select
              className="mt-2 min-h-12 w-full rounded-md border border-border bg-background px-3 text-small text-neutral-50"
              id="scenario-preset"
              onChange={(event) => applyPreset(event.target.value)}
              value={selectedPresetId && selectedPresetId !== "custom" ? selectedPresetId : selectedPresetId === "custom" ? "custom" : "base"}
            >
              <option value="base">Base Case</option>
              <option disabled value="custom">
                Custom
              </option>
              {scenarioPresetList.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>

            <div className="mt-4 rounded-sm border border-border bg-background/35 p-3">
              <p className="text-caption uppercase text-neutral-400">Selected scenario</p>
              <p className="mt-1 text-body font-semibold text-neutral-50">{selectPresetLabel(selectedPresetId)}</p>
              {selectedPreset ? (
                <>
                  <p className="mt-2 text-small text-neutral-300">{selectedPreset.description}</p>
                  <ul className="mt-2 grid gap-1 text-caption text-neutral-300">
                    {selectedPreset.assumptionDetails.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <p
                aria-label="Scenario validation status"
                className="mt-2 text-small text-neutral-300"
                role="status"
              >
                {state.status === "success" ? "Scenario recalculated from transformed statements." : "Scenario has validation issues."}
              </p>
            </div>

            {!isBaseCase ? (
              <Button className="mt-4 w-full sm:w-auto" onClick={resetScenario} type="button" variant="secondary">
                <RotateCcw aria-hidden="true" className="h-5 w-5" />
                Reset to Base Case
              </Button>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {controls.map((control) => (
              <ScenarioControl
                baseInput={baseInput}
                control={control}
                key={control.id}
                onChange={updateControl}
                value={controlInputValue(assumptions, control.id, baseInput)}
              />
            ))}
          </div>
        </div>
      </section>

      {state.status !== "success" ? <ScenarioInvalidState state={state} /> : null}

      {state.status === "success" ? (
        isBaseCase ? (
          <details className="rounded-md border border-border bg-surface p-4 md:p-5">
            <summary className="cursor-pointer text-body font-semibold text-neutral-50" role="button">
              View Base Case analytical reference
            </summary>
            <div className="mt-5 grid gap-5">
              <ScenarioResultSections reducedMotion={reducedMotion} viewModel={viewModel} />
            </div>
          </details>
        ) : (
          <ScenarioResultSections reducedMotion={reducedMotion} viewModel={viewModel} />
        )
      ) : null}

      {state.status === "success" ? <ScenarioMethodology viewModel={viewModel} /> : null}
    </div>
  );
}

function ScenarioContextBar({
  isBaseCase,
  selectedPresetId,
  viewModel,
}: {
  isBaseCase: boolean;
  selectedPresetId: ScenarioPresetId | "custom" | null;
  viewModel: ScenarioComparisonViewModel;
}) {
  const scenarioStatus = isBaseCase ? "Base Case" : selectedPresetId === "custom" ? "Custom scenario" : selectPresetLabel(selectedPresetId);

  return (
    <section aria-label="Scenario context" className="premium-panel rounded-lg p-5">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(18rem,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="text-caption uppercase text-neutral-400">Company / Industry</p>
            <p className="mt-1 text-body font-semibold leading-tight text-neutral-50">{viewModel.company.name}</p>
            <p className="text-small text-neutral-400">{viewModel.company.industry}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 lg:justify-end">
            <ContextItem label="Period" value={String(viewModel.period.latestYear)} />
            <ContextItem label="Currency" value={viewModel.company.currency} />
            <ContextItem label="Comparison" value={viewModel.period.comparisonLabel} />
            <div>
              <p className="text-caption uppercase text-neutral-400">Scenario</p>
              <Badge aria-label={`Scenario status: ${scenarioStatus}`} className="mt-1 whitespace-nowrap">
                {scenarioStatus}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <Button asChild variant="secondary">
            <Link aria-label="Open Executive Dashboard" href="/analysis">
              <Gauge aria-hidden="true" className="h-5 w-5" />
              Executive Dashboard
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link aria-label="Open DuPont Analysis" href="/analysis/dupont">
              <BarChart3 aria-hidden="true" className="h-5 w-5" />
              DuPont Analysis
            </Link>
          </Button>
          <Button asChild>
            <Link aria-label="Edit financials" href="/input">
              <FilePenLine aria-hidden="true" className="h-5 w-5" />
              Edit financials
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link aria-label="Open Methodology" href="/methodology">
              <BookOpen aria-hidden="true" className="h-5 w-5" />
              Methodology
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-caption uppercase text-neutral-400">{label}</p>
      <p className="mt-1 whitespace-nowrap font-mono text-small font-semibold tabular-nums text-neutral-50">{value}</p>
    </div>
  );
}

function BaseCaseState({ viewModel }: { viewModel: ScenarioComparisonViewModel }) {
  return (
    <section aria-label="Base Case active" className="border-y border-border bg-surface-elevated px-4 py-5 md:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-caption uppercase text-neutral-400">Base Case active</p>
          <p className="mt-1 text-body font-semibold text-neutral-50">Choose a preset or modify an assumption to compare a transformed Scenario Case.</p>
        </div>
        <div className="flex items-baseline gap-3 font-mono tabular-nums">
          <span className="text-caption uppercase text-neutral-400">Health Score</span>
          <span className="text-h3 font-semibold text-neutral-50">{viewModel.score.base.display}</span>
          <Badge>{viewModel.score.base.classification}</Badge>
        </div>
      </div>
    </section>
  );
}

function ScenarioResultSections({
  reducedMotion,
  viewModel,
}: {
  reducedMotion: boolean;
  viewModel: ScenarioComparisonViewModel;
}) {
  return (
    <>
      <HealthScoreImpact viewModel={viewModel} />
      <ScenarioDimensionChart reducedMotion={reducedMotion} viewModel={viewModel} />
      <KeyMetricComparison viewModel={viewModel} />
      <ScenarioInsights viewModel={viewModel} />
      <ScenarioDupontComparison viewModel={viewModel} />
    </>
  );
}

function ScenarioControl({
  baseInput,
  control,
  onChange,
  value,
}: {
  baseInput: FinancialAnalysisInput;
  control: ControlConfig;
  onChange: (controlId: ScenarioControlId, value: string) => void;
  value: number | "";
}) {
  const baseValue = latestBaseValue(baseInput, control.id);
  const displayBase =
    control.id === "ebitMarginPercent"
      ? formatFinancialValue({ value: baseValue === null ? null : baseValue / 100, unit: "percentage" }).display
      : formatFinancialValue({ value: baseValue, unit: "currency", currency: baseInput.company.currency }).display;

  return (
    <div className="scenario-control border-t border-border bg-background/20 p-4 first:border-t-0">
      <label className="block text-small font-semibold text-neutral-50" htmlFor={`scenario-${control.id}`}>
        {control.label}
      </label>
      <p className="mt-2 text-caption uppercase tracking-[0.08em] text-neutral-500">Base Case <span className="ml-2 font-mono text-neutral-200">{displayBase}</span></p>
      <div className="mt-3 flex items-center gap-2">
        <input
          aria-describedby={`scenario-${control.id}-hint`}
          className="min-h-11 min-w-0 flex-1 rounded-sm border border-border bg-surface px-3 font-mono text-small tabular-nums text-neutral-50"
          id={`scenario-${control.id}`}
          max={control.max}
          min={control.min}
          onChange={(event) => onChange(control.id, event.target.value)}
          step={control.step}
          type="number"
          value={value}
        />
        <span className="text-small text-neutral-300">{control.unit}</span>
      </div>
      <input aria-label={`Adjust ${control.label} scenario assumption`} className="scenario-range mt-4 w-full" max={control.max} min={control.min} onChange={(event) => onChange(control.id, event.target.value)} step={control.step} type="range" value={value === "" ? 0 : value} />
      <div className="mt-1 flex justify-between font-mono text-caption tabular-nums text-neutral-500"><span>{control.min}{control.unit}</span><span>Scenario assumption</span><span>{control.max}{control.unit}</span></div>
      <p className="mt-2 text-caption text-neutral-300" id={`scenario-${control.id}-hint`}>
        {control.meaning}
      </p>
    </div>
  );
}

function ScenarioInvalidState({ state }: { state: Exclude<ReturnType<typeof buildViewModelFromPipeline>, { status: "success" }> }) {
  const messages =
    state.status === "transformation-error"
      ? state.issues.map((issue) => issue.message)
      : state.status === "canonical-validation-error"
        ? state.issues
        : [state.message];

  return (
    <section className="rounded-md border border-danger/40 bg-danger/10 p-5" role="alert">
      <h2 className="text-h4 font-semibold text-neutral-50">Scenario Case cannot be applied</h2>
      <ul className="mt-3 grid gap-2 text-small text-neutral-200">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </section>
  );
}

function HealthScoreImpact({ viewModel }: { viewModel: ScenarioComparisonViewModel }) {
  return (
    <section aria-label="Health score impact" className="premium-panel rounded-lg p-6 md:p-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <ScoreCase label="Base Case" score={viewModel.score.base.display} classification={viewModel.score.base.classification} />
        <div aria-hidden="true" className="hidden text-h2 text-neutral-500 lg:block">
          →
        </div>
        <ScoreCase
          animate
          label="Scenario Case"
          score={viewModel.score.scenario.display}
          classification={viewModel.score.scenario.classification}
        />
        <div className="border-l border-border pl-4">
          <p className="premium-kicker">Scenario impact</p>
          <p className="mt-2 font-mono text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-none tabular-nums text-blue-200">{viewModel.score.delta.display}</p>
          <p className="mt-2 text-small text-neutral-300">{viewModel.score.headline}</p>
          <p className="mt-2 text-caption text-neutral-400">
            Coverage: {viewModel.score.base.coverageDisplay} Base Case / {viewModel.score.scenario.coverageDisplay} Scenario Case
          </p>
        </div>
      </div>
    </section>
  );
}

function ScoreCase({ animate = false, classification, label, score }: { animate?: boolean; classification: string; label: string; score: string }) {
  return (
    <div className={`border-y border-border py-5 ${animate ? "premium-score-shift" : ""}`}>
      <p className="premium-kicker">{label}</p>
      <p className="mt-3 font-mono text-[clamp(3rem,6vw,5rem)] font-semibold leading-none tabular-nums text-neutral-50">{score}</p>
      <Badge className="mt-2">{classification}</Badge>
    </div>
  );
}

function ScenarioDimensionChart({
  reducedMotion,
  viewModel,
}: {
  reducedMotion: boolean;
  viewModel: ScenarioComparisonViewModel;
}) {
  return (
    <ChartContainer
      accessibleDescription={viewModel.dimensionChart.summary}
      accessibleName="Scenario dimension comparison"
      option={buildScenarioDimensionComparisonOption(viewModel.dimensionChart, reducedMotion)}
      summary={
        <div className="grid gap-2 text-small text-neutral-300 sm:grid-cols-2 lg:grid-cols-5">
          {viewModel.dimensions.map((dimension) => (
            <p key={dimension.category}>
              <span className="font-semibold text-neutral-50">{dimension.label}:</span> {dimension.baseScore.display} Base /
              {" "}
              {dimension.scenarioScore.display} Scenario ({dimension.delta.display})
            </p>
          ))}
        </div>
      }
    />
  );
}

function KeyMetricComparison({ viewModel }: { viewModel: ScenarioComparisonViewModel }) {
  return (
    <section aria-label="Key metric comparison" className="border-y border-border py-6">
      <p className="premium-kicker">Scenario evidence</p><h2 className="mt-2 text-h3 font-semibold text-neutral-50">Key metric comparison</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[820px] w-full border-collapse text-left text-small">
          <thead className="text-caption uppercase text-neutral-400">
            <tr className="border-b border-border">
              <th className="py-2 pr-4">Metric</th>
              <th className="py-2 pr-4">Base Case</th>
              <th className="py-2 pr-4">Scenario Case</th>
              <th className="py-2 pr-4">Change</th>
              <th className="py-2 pr-4">Direction</th>
              <th className="py-2">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {viewModel.keyMetrics.map((metric) => (
              <tr className="border-b border-border/70 align-top" key={metric.label}>
                <th className="py-3 pr-4 font-semibold text-neutral-50">{metric.label}</th>
                <td className="py-3 pr-4 font-mono tabular-nums text-neutral-200">{metric.baseValue.display}</td>
                <td className="py-3 pr-4 font-mono tabular-nums text-neutral-50">{metric.scenarioValue.display}</td>
                <td className="py-3 pr-4 font-mono tabular-nums text-neutral-200">
                  {metric.absoluteChange.display}
                  <span className="ml-2 text-neutral-500">({metric.percentageChange.display})</span>
                </td>
                <td className="py-3 pr-4 text-neutral-200">{metric.direction}</td>
                <td className="py-3 text-neutral-300">{metric.interpretation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ScenarioInsights({ viewModel }: { viewModel: ScenarioComparisonViewModel }) {
  const groups = [
    { title: "New strengths", items: viewModel.insightComparison.newStrengths },
    { title: "New risks", items: viewModel.insightComparison.newRisks },
    { title: "Persistent risks", items: viewModel.insightComparison.persistentRisks },
    { title: "Resolved risks", items: viewModel.insightComparison.resolvedRisks },
  ];

  return (
    <section aria-label="Updated scenario insights" className="border-y border-border py-6">
      <p className="premium-kicker">Scenario evidence</p><h2 className="mt-2 text-h3 font-semibold text-neutral-50">Updated scenario insights</h2>
      <div className="mt-5 grid gap-x-8 gap-y-6 lg:grid-cols-2">
        {groups.map((group) => (
          <div className="border-t border-border pt-3" key={group.title}>
            <h3 className="text-body font-semibold text-neutral-50">{group.title}</h3>
            {group.items.length === 0 ? (
              <p className="mt-2 text-small text-neutral-400">No insight change in this group.</p>
            ) : (
              <ol className="mt-2 grid gap-0">
                {group.items.slice(0, 3).map((insight, index) => (
                  <li className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-b border-border py-4 last:border-b-0" key={insight.id}>
                    <span className="font-mono text-small text-blue-300">0{index + 1}</span><div><p className="font-semibold text-neutral-50">{insight.title}</p>
                    <p className="mt-1 text-small text-neutral-300">{insight.explanation}</p>
                    <p className="mt-2 text-caption uppercase text-neutral-400">
                      Severity: {insight.severityLabel} · Trend: {insight.trendLabel} · Year: {insight.affectedYear}
                    </p>
                    {insight.evidence.length > 0 ? (
                      <ul className="mt-2 grid gap-1 text-caption text-neutral-300">
                        {insight.evidence.map((evidence) => (
                          <li key={`${insight.id}-${evidence.label}-${evidence.value}`}>
                            {evidence.label}: <span className="font-mono tabular-nums">{evidence.value}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ScenarioDupontComparison({ viewModel }: { viewModel: ScenarioComparisonViewModel }) {
  return (
    <section aria-label="DuPont scenario comparison" className="rounded-md border border-border bg-surface p-4 md:p-5">
      <h2 className="text-h4 font-semibold text-neutral-50">DuPont scenario comparison</h2>
      <p className="mt-2 text-small text-neutral-300">{viewModel.dupont.summary}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {viewModel.dupont.factors.map((factor) => (
          <div className="rounded-sm border border-border bg-background/35 p-3" key={factor.label}>
            <p className="text-small font-semibold text-neutral-50">{factor.label}</p>
            <p className="mt-2 text-caption uppercase text-neutral-400">Base Case</p>
            <p className="font-mono text-body font-semibold tabular-nums text-neutral-200">{factor.baseValue.display}</p>
            <p className="mt-2 text-caption uppercase text-neutral-400">Scenario Case</p>
            <p className="font-mono text-body font-semibold tabular-nums text-neutral-50">{factor.scenarioValue.display}</p>
            <p className="mt-2 text-small text-neutral-300">{factor.delta.display} · {factor.direction}</p>
            <p className="mt-2 text-caption text-neutral-400">{factor.meaning}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScenarioMethodology({ viewModel }: { viewModel: ScenarioComparisonViewModel }) {
  return (
    <section className="rounded-md border border-border bg-surface p-4 md:p-5">
      <details>
        <summary className="cursor-pointer text-h4 font-semibold text-neutral-50" role="button">
          Scenario assumptions and limitations
        </summary>
        <p className="mt-3 text-small text-neutral-300">{viewModel.methodology.summary}</p>
        <h3 className="mt-4 text-body font-semibold text-neutral-50">Changed statement fields</h3>
        {viewModel.changedFields.length === 0 ? (
          <p className="mt-2 text-small text-neutral-400">No statement fields changed from the Base Case.</p>
        ) : (
          <ul className="mt-2 grid gap-2 text-small text-neutral-300">
            {viewModel.changedFields.map((field, index) => (
              <li key={`${field.path}-${field.label}-${index}`}>
                {field.label}: {field.baseValue.display} Base Case → {field.scenarioValue.display} Scenario Case ({field.change.display})
              </li>
            ))}
          </ul>
        )}
        <h3 className="mt-4 text-body font-semibold text-neutral-50">Propagation rules</h3>
        <div className="mt-2 grid gap-3">
          {viewModel.methodology.propagationRules.map((rule) => (
            <div className="border-t border-border pt-3 text-small text-neutral-300" key={rule.label}>
              <p className="font-semibold text-neutral-50">{rule.label}</p>
              <p>Source: {rule.sourceLabel}</p>
              <p>Transformation: {rule.transformation}</p>
              <p>Also affects: {rule.affectedValues}</p>
              <p>Balancing assumption: {rule.balancingAssumption}</p>
              <p>Limitation: {rule.limitation}</p>
            </div>
          ))}
        </div>
        <h3 className="mt-4 text-body font-semibold text-neutral-50">Limitations</h3>
        <ul className="mt-2 grid gap-1 text-small text-neutral-300">
          {viewModel.methodology.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
