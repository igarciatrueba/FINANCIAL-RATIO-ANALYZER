import type { DashboardDimensionRadarViewModel, DashboardProfitabilityWaterfallViewModel, DashboardScoreContributionViewModel } from "@/features/executive-dashboard/types/dashboard.types";

// Report-only vector primitives. Arithmetic here maps existing values to paper coordinates.
export const reportColors = { ink: "#182B36", muted: "#526572", grid: "#D7E1E5", current: "#087D79", prior: "#8A98A9", negative: "#B44047", bridge: "#A57122" };
export const escapeSvg = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const text = (x: number, y: number, value: string, anchor = "middle", color = reportColors.muted) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Roboto" font-size="10" fill="${color}">${escapeSvg(value)}</text>`;
const line = (x: number, y: number, x2: number, y2: number, color = reportColors.grid) => `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1"/>`;
const svg = (height: number, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="${height}" viewBox="0 0 500 ${height}">${body}</svg>`;
const finite = (n: number | null): n is number => n !== null && Number.isFinite(n);

export function trendSvg(points: Array<{ year: number; value: number | null; displayValue: string }>, unit: string): string {
  const values = points.map(p => p.value).filter(finite);
  if (!values.length) return svg(110, text(250, 45, "Trend unavailable - no supported observations") + text(250, 75, points.map(p => String(p.year)).join(" / ")));
  const scale = Math.max(1, ...values.map(Math.abs));
  const low = Math.min(0, ...values.map(v => v / scale));
  const high = Math.max(0.1, ...values.map(v => v / scale));
  const y = (v: number) => 150 - ((v / scale - low) / (high - low)) * 110;
  const x = (i: number) => 100 + i * 330 / Math.max(1, points.length - 1);
  let body = text(10, 13, unit, "start");
  for (let i = 0; i <= 4; i++) {
    const value = (low + (high - low) * i / 4) * scale;
    const label = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1, notation: Math.abs(value) >= 10000 ? "compact" : "standard", ...(unit === "percentage" ? { style: "percent" as const } : {}) }).format(value);
    body += line(64, 150 - i * 27.5, 440, 150 - i * 27.5) + text(57, 154 - i * 27.5, label, "end");
  }
  points.forEach((p, i) => {
    body += text(x(i), 180, String(p.year));
    if (!finite(p.value)) { body += text(x(i), 115, "Unavailable"); return; }
    const previous = points[i - 1];
    if (previous && finite(previous.value)) body += line(x(i - 1), y(previous.value), x(i), y(p.value), reportColors.current);
    body += `<circle cx="${x(i)}" cy="${y(p.value)}" r="4" fill="${reportColors.current}"/>` + text(x(i), y(p.value) - 13, p.displayValue, "middle", reportColors.ink);
  });
  return svg(195, body);
}

export function radarSvg(radar: DashboardDimensionRadarViewModel): string {
  const point = (i: number, value: number) => {
    const angle = -Math.PI / 2 + i * 2 * Math.PI / radar.indicators.length;
    return [250 + Math.cos(angle) * 95 * value / 100, 132 + Math.sin(angle) * 95 * value / 100];
  };
  let body = "";
  for (const level of [25, 50, 75, 100]) body += `<polygon points="${radar.indicators.map((_, i) => point(i, level).join(",")).join(" ")}" fill="none" stroke="${reportColors.grid}"/>`;
  radar.indicators.forEach((d, i) => { const [x, y] = point(i, 130); body += text(x, y + 4, d.label) + line(250, 132, ...point(i, 100) as [number, number]); });
  for (const [series, color] of [[radar.previous, reportColors.prior], [radar.current, reportColors.current]] as const) {
    if (!series) continue;
    series.values.forEach((v, i) => {
      if (!finite(v)) return;
      const [x, y] = point(i, v);
      const next = series.values[(i + 1) % series.values.length];
      if (finite(next)) body += line(x, y, ...point((i + 1) % series.values.length, next) as [number, number], color);
      body += `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`;
    });
  }
  return svg(270, body);
}

export function buildWaterfallGeometry(vm: DashboardProfitabilityWaterfallViewModel) {
  let balance = 0;
  return vm.steps.map(step => {
    if (!finite(step.rawValue)) return { ...step, start: null, end: null };
    const total = step.kind === "total" || step.kind === "subtotal";
    const start = total ? 0 : balance;
    const end = total ? step.rawValue : balance + step.rawValue;
    balance = end;
    return { ...step, start, end };
  });
}

export function waterfallSvg(vm: DashboardProfitabilityWaterfallViewModel): string {
  const steps = buildWaterfallGeometry(vm);
  const values = steps.flatMap(s => [s.start, s.end]).filter(finite);
  const scale = Math.max(1, ...values.map(Math.abs));
  const low = Math.min(0, ...values.map(v => v / scale));
  const high = Math.max(0.1, ...values.map(v => v / scale));
  const y = (v: number) => 165 - (v / scale - low) / (high - low) * 135;
  const width = 460 / Math.max(1, steps.length);
  let body = line(20, y(0), 480, y(0));
  steps.forEach((s, i) => {
    const x = 20 + width * i;
    body += text(x + width / 2, 190, String(i + 1));
    if (s.start === null || s.end === null) return;
    const color = s.kind === "bridge" ? reportColors.bridge : s.kind === "subtotal" || s.kind === "total" ? reportColors.current : s.end < s.start ? reportColors.negative : reportColors.current;
    body += `<rect x="${x + 8}" y="${Math.min(y(s.start), y(s.end))}" width="${width - 16}" height="${Math.max(0.7, Math.abs(y(s.start) - y(s.end)))}" fill="${color}"/>`;
    if (i < steps.length - 1) body += line(x + width - 8, y(s.end), x + width + 8, y(s.end));
  });
  return svg(205, body);
}

export function contributionSvg(vm: DashboardScoreContributionViewModel): string {
  const scale = Math.max(1, ...vm.dimensions.map(d => d.contribution ?? 0));
  return svg(180, vm.dimensions.map((d, i) => {
    const y = 15 + i * 33;
    return text(5, y + 10, d.label, "start") + (finite(d.contribution) ? `<rect x="115" y="${y}" width="${d.contribution / scale * 265}" height="14" fill="${reportColors.current}"/>` : "") + text(490, y + 11, d.displayContribution, "end");
  }).join(""));
}
