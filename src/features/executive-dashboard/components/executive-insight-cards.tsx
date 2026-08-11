import { Badge } from "@/components/ui/badge";
import type { DashboardInsightViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type ExecutiveInsightCardsProps = {
  title: string;
  type: "strength" | "risk";
  insights: DashboardInsightViewModel[];
};

export function ExecutiveInsightCards({ title, type, insights }: ExecutiveInsightCardsProps) {
  const variant = type === "strength" ? "success" : "danger";

  return (
    <section aria-label={`Executive ${type} cards`} className="border-t border-border pt-5" role="region">
      <div>
        <p className="premium-kicker">{type === "strength" ? "Positive signals" : "Primary pressure"}</p>
        <h2 className="mt-2 text-h3 font-semibold text-neutral-50">{title}</h2>
      </div>

      {insights.length === 0 ? (
        <p className="mt-5 rounded-sm border border-border bg-background/35 p-4 text-small text-neutral-300">
          No executive {type} cards were generated.
        </p>
      ) : (
        <ol className="mt-5 grid gap-0">
          {insights.map((insight, index) => (
            <li className="border-b border-border py-5 last:border-b-0" key={insight.id}>
              <div className="grid gap-3 sm:grid-cols-[3rem_minmax(0,1fr)]">
                <div className="font-mono text-[1.8rem] font-semibold leading-none text-blue-300" aria-hidden="true">0{index + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-small font-semibold text-neutral-50">{insight.title}</h3>
                    <Badge variant={variant}>{insight.severityLabel} severity</Badge>
                    <Badge>{insight.trendLabel}</Badge>
                  </div>
                  <p className="mt-2 text-small text-neutral-300">{insight.explanation}</p>
                  <dl className="mt-4 grid gap-3 border-t border-border pt-3 text-caption md:grid-cols-[0.8fr_minmax(0,2fr)]">
                    <div>
                      <dt className="uppercase text-neutral-400">Affected year</dt>
                      <dd className="mt-1 font-semibold text-neutral-100">{insight.affectedYear}</dd>
                    </div>
                    <div>
                      <dt className="uppercase text-neutral-400">Evidence</dt>
                      <dd className="mt-1 grid gap-1 font-semibold text-neutral-100">
                        {insight.evidence.length > 0
                          ? insight.evidence.map((item) => (
                              <span key={`${insight.id}-${item.label}-${item.context}`}>
                                {item.label}: <span title={item.accessibleText}>{item.value}</span>
                                {item.context ? <span className="font-normal text-neutral-400"> · {item.context}</span> : null}
                              </span>
                            ))
                          : "Unavailable"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
