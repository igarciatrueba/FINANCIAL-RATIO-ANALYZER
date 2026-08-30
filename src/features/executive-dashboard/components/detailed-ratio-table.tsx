import type { ReactNode } from "react";

import type { DashboardRatioTableViewModel } from "@/features/executive-dashboard/types/dashboard.types";

type DetailedRatioTableProps = {
  ratioTable: DashboardRatioTableViewModel;
};

export function DetailedRatioTable({ ratioTable }: DetailedRatioTableProps) {
  return (
    <section aria-label="Detailed ratio table" className="min-w-0 rounded-md border border-border bg-surface p-5 md:p-6" role="region">
      <div>
        <p className="text-caption uppercase text-neutral-400">Detailed ratio table</p>
        <h2 className="mt-1 text-h4 font-semibold text-neutral-50">Implemented ratio outputs</h2>
        <p className="mt-2 text-small text-neutral-400">Grouped read-only ratios from the formula registry and current analysis result.</p>
      </div>

      <div className="mt-5 grid min-w-0 gap-5">
        {ratioTable.groups.map((group) => (
          <section aria-labelledby={`ratio-group-${group.category}`} className="min-w-0" key={group.category}>
            <h3 className="text-body font-semibold text-neutral-50" id={`ratio-group-${group.category}`}>
              {group.label}
            </h3>
            <div className="mt-3 min-w-0 max-w-full overflow-x-auto rounded-sm border border-border">
              <table className="financial-ratio-table min-w-[1040px] border-collapse text-left text-caption">
                <thead className="bg-background/60 text-neutral-300">
                  <tr>
                    <Th>Ratio</Th>
                    <Th>Current</Th>
                    <Th>Previous</Th>
                    <Th>Change</Th>
                    <Th>Direction</Th>
                    <Th>Unit</Th>
                    <Th>Availability</Th>
                    <Th>Formula and interpretation</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {group.rows.map((row) => (
                    <tr className="bg-background/25 align-top" key={row.label}>
                      <Td strong>{row.label}</Td>
                      <Td mono title={row.currentValue.title}>
                        {row.currentValue.display}
                      </Td>
                      <Td mono title={row.previousValue.title}>
                        {row.previousValue.display}
                      </Td>
                      <Td mono title={row.change.title}>
                        {row.change.display}
                      </Td>
                      <Td>{row.direction}</Td>
                      <Td>{row.unit}</Td>
                      <Td>
                        {row.availability}
                        {row.unavailableReason ? <span className="block text-neutral-500">{row.unavailableReason}</span> : null}
                      </Td>
                      <Td>
                        <details>
                          <summary className="cursor-pointer font-semibold text-neutral-100">Formula and interpretation</summary>
                          <p className="font-technical mt-2 text-neutral-200">{row.formula}</p>
                          <p className="mt-2 text-neutral-300">{row.interpretation}</p>
                          <p className="mt-2 text-neutral-500">{row.description}</p>
                        </details>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="border-b border-border px-3 py-3 font-semibold uppercase tracking-normal">{children}</th>;
}

function Td({
  children,
  mono,
  strong,
  title,
}: {
  children: ReactNode;
  mono?: boolean;
  strong?: boolean;
  title?: string;
}) {
  return (
    <td className={`px-3 py-3 text-neutral-300 ${mono ? "font-mono tabular-nums" : ""} ${strong ? "font-semibold text-neutral-50" : ""}`} title={title}>
      {children}
    </td>
  );
}
