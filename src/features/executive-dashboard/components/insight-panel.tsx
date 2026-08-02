import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { DashboardInsightViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type InsightPanelProps = {
  title: string;
  description: string;
  type: "strength" | "risk";
  insights: DashboardInsightViewModel[];
};

export function InsightPanel({ title, description, type, insights }: InsightPanelProps) {
  const Icon = type === "strength" ? CheckCircle2 : AlertTriangle;
  const badgeVariant = type === "strength" ? "success" : "danger";

  return (
    <section aria-labelledby={`${type}-insights-heading`} className="rounded-md border border-border bg-surface p-5 md:p-6">
      <div>
        <p className="text-caption uppercase text-neutral-400">{type === "strength" ? "Principal strengths" : "Principal risks"}</p>
        <h2 className="mt-1 text-h4 font-semibold text-neutral-50" id={`${type}-insights-heading`}>
          {title}
        </h2>
        <p className="mt-2 text-small text-neutral-400">{description}</p>
      </div>

      {insights.length === 0 ? (
        <p className="mt-5 rounded-sm border border-border bg-background/35 p-4 text-small text-neutral-300">
          No principal {type === "strength" ? "strengths" : "risks"} were generated for this analysis.
        </p>
      ) : (
        <ol className="mt-5 grid gap-4">
          {insights.map((insight, index) => (
            <li className="rounded-sm border border-border bg-background/35 p-4" key={insight.id}>
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-border bg-surface">
                  <span className="sr-only">Insight {index + 1}</span>
                  <Icon aria-hidden="true" className="h-4 w-4 text-neutral-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-small font-semibold text-neutral-50">{insight.title}</h3>
                    <Badge variant={badgeVariant}>{insight.severityLabel} severity</Badge>
                    <Badge>{insight.trendLabel}</Badge>
                  </div>
                  <p className="mt-2 text-small text-neutral-300">{insight.explanation}</p>
                  <p className="mt-2 text-caption text-neutral-400">Affected year: {insight.affectedYear}</p>

                  <div className="mt-4 grid gap-2">
                    {insight.evidence.map((evidence) => (
                      <div
                        className="grid gap-1 rounded-sm border border-border bg-surface/70 p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                        key={`${insight.id}-${evidence.label}-${evidence.context}`}
                      >
                        <div>
                          <p className="text-caption uppercase text-neutral-400">{evidence.label}</p>
                          <p className="text-caption text-neutral-500">{evidence.context}</p>
                        </div>
                        <p className="font-mono text-small font-semibold tabular-nums text-neutral-50">{evidence.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
