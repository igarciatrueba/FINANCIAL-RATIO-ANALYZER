import { BookOpenText, Gauge, ShieldCheck, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ExecutiveDashboardViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type ExecutiveDiagnosisProps = {
  viewModel: ExecutiveDashboardViewModel;
};

export function ExecutiveDiagnosis({ viewModel }: ExecutiveDiagnosisProps) {
  return (
    <section
      aria-label="Executive diagnosis"
      className="analytical-surface rounded-lg p-6 md:p-8"
      role="region"
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="premium-kicker">Executive diagnosis</p>
          <h2 className="mt-2 text-h2 font-semibold leading-tight tracking-tight text-neutral-50" id="executive-diagnosis-heading">
            {viewModel.diagnosis.headline}
          </h2>
          <p className="mt-3 text-small text-neutral-300">{viewModel.diagnosis.summary}</p>
        </div>

        <div className="grid gap-0 border-y border-border">
          <DiagnosisLine icon={ShieldCheck} label="Strongest area" text={viewModel.diagnosis.strongestArea} />
          <DiagnosisLine icon={Target} label="Primary pressure point" text={viewModel.diagnosis.primaryPressure} />
          <DiagnosisLine icon={Gauge} label="Evidence context" text={viewModel.diagnosis.driverContext} />
        </div>

        <dl className="grid gap-3 border-y border-border py-3 md:grid-cols-3">
          <ReadoutItem label="Key improvement" text={viewModel.executiveSummary.keyImprovement} />
          <ReadoutItem label="Primary concern" text={viewModel.executiveSummary.primaryConcern} />
          <ReadoutItem label="Coverage" text={viewModel.executiveSummary.coverage} />
        </dl>

        <div className="crystal-surface rounded-md p-3">
          <div className="flex items-start gap-3">
            <BookOpenText aria-hidden="true" className="mt-1 h-4 w-4 text-information" />
            <div>
              <Badge variant="info">Educational score</Badge>
              <p className="mt-2 text-caption leading-relaxed text-neutral-300">{viewModel.diagnosis.disclaimer}</p>
            </div>
          </div>
        </div>

        <p className="text-caption text-neutral-400">{viewModel.diagnosis.coverageContext}</p>
      </div>
    </section>
  );
}

function ReadoutItem({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="text-caption uppercase text-neutral-400">{label}</dt>
      <dd className="mt-1 text-caption leading-relaxed text-neutral-100">{text}</dd>
    </div>
  );
}

function DiagnosisLine({
  icon: Icon,
  label,
  text,
}: {
  icon: LucideIcon;
  label: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 border-b border-border py-4 last:border-0">
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 text-neutral-300" />
      <div>
        <p className="text-caption uppercase text-neutral-400">{label}</p>
        <p className="mt-1 text-small text-neutral-100">{text}</p>
      </div>
    </div>
  );
}
