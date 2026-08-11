"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, Gauge, Network, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChartContainer, useReducedMotionPreference } from "@/features/executive-dashboard/charts/chart-container";
import { buildRatioTrendOption } from "@/features/executive-dashboard/charts/chart-options";
import type { RatioCategory } from "@/domain";
import type { RatioAnalysisViewModel } from "@/features/ratio-analysis/lib/build-ratio-analysis-view-model";

export function RatioAnalysis({ viewModel }: { viewModel: RatioAnalysisViewModel }) {
  const [category, setCategory] = useState<RatioCategory>(viewModel.defaultCategory);
  const [metricId, setMetricId] = useState(viewModel.trend.defaultMetricId);
  const metrics = viewModel.trend.metricsByCategory[category];
  const selected = viewModel.trend.metricsById[metricId] ?? metrics[0];
  const reducedMotion = useReducedMotionPreference();
  const group = viewModel.table.groups.find((item) => item.category === category);
  const selectedCategory = viewModel.categories.find((item) => item.id === category)?.label ?? "Ratios";
  const selectedRow = group?.rows.find((row) => row.label === selected.label);

  return <div className="premium-workspace grid min-w-0 gap-9 premium-enter">
    <RatioContext viewModel={viewModel} />
    <section aria-label="Ratio category navigation" className="border-y border-border py-4"><div className="flex flex-wrap items-center gap-x-6 gap-y-2">{viewModel.categories.map((item) => <button aria-pressed={item.id === category} className={`border-b-2 px-0 py-2 text-small font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${item.id === category ? "border-primary text-white" : "border-transparent text-neutral-500 hover:text-neutral-200"}`} key={item.id} onClick={() => { setCategory(item.id); setMetricId(viewModel.trend.metricsByCategory[item.id][0]?.metricId ?? viewModel.trend.defaultMetricId); }} type="button">{item.label} <span className="ml-1 font-mono text-caption">{item.count}</span></button>)}</div></section>
    <section aria-label="Selected financial ratio" className="grid gap-7 border-b border-border pb-9 xl:grid-cols-[minmax(16rem,0.75fr)_minmax(0,1.25fr)]">
      <div className="flex flex-col justify-between"><div><p className="premium-kicker">{selectedCategory}</p><h2 className="mt-3 text-[clamp(2.4rem,5vw,4.8rem)] font-semibold leading-none tracking-tight text-white">{selected.label}</h2><p className="mt-5 font-mono text-[clamp(3.4rem,7vw,6.2rem)] font-semibold leading-none tracking-tight text-blue-200" title={selected.currentValue.title}>{selected.currentValue.display}</p><p className="mt-3 flex items-center gap-2 font-mono text-small tabular-nums text-neutral-300"><span className="text-neutral-500">vs {viewModel.period.previous ?? "prior"}</span> {selected.change.display}</p></div><dl className="mt-8 grid gap-4 border-t border-border pt-5 text-small"><Info label="Financial direction" value={viewModel.financialDirection(selected.metricId, selected.direction)} /><Info label="Formula" value={selectedRow?.formula ?? "Unavailable"} mono /><Info label="Availability" value={selected.currentValue.unavailableReason ? `Unavailable: ${selected.currentValue.unavailableReason}` : "Available"} /></dl></div>
      <ChartContainer accessibleDescription={selected.accessibleDescription} accessibleName={`${selected.label} trend`} heightClassName="h-[20rem]" option={buildRatioTrendOption(selected, reducedMotion)} summary={<div className="mt-4 grid gap-3 border-t border-border pt-4 text-small text-neutral-300 sm:grid-cols-3"><p><b>Current</b><br />{selected.currentValue.display}</p><p><b>Previous</b><br />{selected.previousValue.display}</p><p><b>Movement</b><br />{viewModel.financialDirection(selected.metricId, selected.direction)}</p><p className="sm:col-span-3">{selected.summary}</p></div>} />
    </section>
    <section aria-label="Ratio selectors" className="border-b border-border pb-7"><MetricSelector onChange={setMetricId} options={metrics.map((item) => ({ value: item.metricId, label: item.label }))} value={selected.metricId} /></section>
    <section aria-label="Detailed ratio table" className="min-w-0"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="premium-kicker">Full catalogue</p><h2 className="mt-2 text-h2 font-semibold tracking-tight text-white">Explore all {group?.label} ratios</h2></div><p className="max-w-sm text-small text-neutral-400">{viewModel.availability} of {viewModel.configured} outputs are available. An unavailable result is never shown as zero.</p></div><div className="mt-6 max-w-full overflow-x-auto border-y border-border"><table className="min-w-[980px] border-collapse text-left text-caption"><thead className="sticky top-0 bg-[#0e1218] text-neutral-300"><tr>{["Ratio", "Current", "Previous", "Change", "Financial direction", "Availability", "Formula and interpretation"].map((heading) => <th className="border-b border-border px-3 py-3 font-semibold" key={heading}>{heading}</th>)}</tr></thead><tbody className="divide-y divide-border">{group?.rows.map((row) => <tr className="align-top transition-colors hover:bg-blue-500/5" key={row.label}><td className="px-3 py-4 font-semibold text-neutral-50">{row.label}</td><td className="px-3 py-4 font-mono tabular-nums">{row.currentValue.display}</td><td className="px-3 py-4 font-mono tabular-nums">{row.previousValue.display}</td><td className="px-3 py-4 font-mono tabular-nums">{row.change.display}</td><td className="px-3 py-4">{viewModel.financialDirection(row.label.toLowerCase().replaceAll(" ", "-"), row.direction)}</td><td className="px-3 py-4">{row.availability}{row.unavailableReason ? <span className="block text-neutral-500">{row.unavailableReason}</span> : null}</td><td className="px-3 py-4"><details><summary className="cursor-pointer font-semibold text-neutral-100">Formula and interpretation</summary><p className="mt-3 font-mono text-neutral-200">{row.formula}</p><p className="mt-2 text-neutral-300">{row.interpretation}</p><p className="mt-2 text-neutral-400">{row.description}</p></details></td></tr>)}</tbody></table></div></section>
  </div>;
}

function RatioContext({ viewModel }: { viewModel: RatioAnalysisViewModel }) { return <section className="premium-panel rounded-lg p-5"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="premium-kicker">Analytical context</p><p className="mt-2 text-h3 font-semibold text-white">{viewModel.company.name}</p><p className="text-small text-neutral-400">{viewModel.company.industry}</p></div><div className="grid grid-cols-2 gap-x-7 gap-y-3 text-small sm:flex sm:gap-7"><Info label="Current period" value={String(viewModel.period.current)} /><Info label="Comparison" value={viewModel.period.previous ? String(viewModel.period.previous) : "Unavailable"} /><Info label="Currency" value={viewModel.company.currency} /><Info label="Coverage" value={`${viewModel.coverage.toFixed(0)}%`} /></div><div className="flex flex-wrap gap-2"><Action href="/analysis" icon={Gauge} label="Overview" /><Action href="/analysis/dupont" icon={Network} label="DuPont" /><Action href="/scenario" icon={SlidersHorizontal} label="Scenario" /><Action href="/methodology" icon={BookOpen} label="Methodology" /></div></div></section>; }
function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div><p className="text-caption uppercase tracking-[0.08em] text-neutral-500">{label}</p><p className={`mt-1 text-small font-semibold text-neutral-100 ${mono ? "font-mono" : ""}`}>{value}</p></div>; }
function Action({ href, icon: Icon, label }: { href: string; icon: typeof Gauge; label: string }) { return <Button asChild className="min-h-9 px-3 text-caption" variant="ghost"><Link href={href}><Icon aria-hidden="true" className="h-3.5 w-3.5" />{label}<ArrowRight aria-hidden="true" className="h-3 w-3" /></Link></Button>; }
function MetricSelector({ onChange, options, value }: { onChange: (value: string) => void; options: Array<{ value: string; label: string }>; value: string }) {
  return <label className="premium-metric-selector grid max-w-xl gap-2">
    <span className="premium-kicker">Select metric</span>
    <span className="relative block">
      <select aria-label="Metric" className="min-h-14 w-full appearance-none border border-border bg-surface px-4 pr-12 text-body font-semibold text-neutral-50 shadow-[0_12px_32px_rgb(0_0_0/0.18)]" onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-information">⌄</span>
    </span>
    <span className="text-caption text-neutral-400">Choose a ratio within the active {options.length > 0 ? "category" : "selection"}. Arrow keys and native keyboard selection remain available.</span>
  </label>;
}
