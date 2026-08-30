"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, ChartNoAxesCombined, CircleCheck, GitBranch, Network, SlidersHorizontal, Sparkles } from "lucide-react";

import { EquiverseLogo } from "@/components/brand/equiverse-logo";
import { Button } from "@/components/ui/button";
import { LandingEngineMapPreview } from "@/features/engine-map";
import type { PremiumLandingViewModel } from "@/features/premium-landing/lib/build-premium-landing-view-model";
import { BRAND } from "@/lib/brand";

const capabilitySections = [
  { number: "01", id: "health", title: "Financial Health", text: "One transparent view across profitability, liquidity, solvency, efficiency and cash flow.", href: "/analysis", icon: ChartNoAxesCombined, visual: "signals" },
  { number: "02", id: "ratios", title: "Ratio Analysis", text: "Inspect every registered ratio, its history, formula, availability and directional meaning.", href: "/analysis/ratios", icon: Sparkles, visual: "ratios" },
  { number: "03", id: "dupont", title: "DuPont Drivers", text: "See exactly how margin, turnover and leverage reconcile into return on equity.", href: "/analysis/dupont", icon: GitBranch, visual: "dupont" },
  { number: "04", id: "scenarios", title: "Scenario Lab", text: "Test explicit statement assumptions through the same validated financial engine.", href: "/scenario", icon: SlidersHorizontal, visual: "scenarios" },
  { number: "05", id: "engine", title: "Engine Map", text: "Trace every output from canonical input through deterministic analytical stages.", href: "/engine-map", icon: Network, visual: "engine" },
] as const;

function CapabilityModule({ section }: { section: (typeof capabilitySections)[number] }) {
  const Icon = section.icon;
  return <Link aria-label={`Open ${section.title}`} className="capability-module" data-capability={section.id} href={section.href}><span className="capability-module-index">{section.number}</span><span className="capability-module-icon"><Icon aria-hidden="true" className="h-4 w-4" /></span><span className="capability-module-copy"><span className="text-h4 font-semibold text-neutral-50">{section.title}</span><span className="landing-description mt-2 block max-w-md text-small leading-6 text-neutral-400">{section.text}</span></span><CapabilityVisual kind={section.visual} /><span className="capability-module-link">Open <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></span></Link>;
}

function CapabilityVisual({ kind }: { kind: (typeof capabilitySections)[number]["visual"] }) {
  if (kind === "dupont") return <span aria-hidden="true" className="capability-visual capability-visual-dupont"><b className="capability-tree-root">ROE</b><span className="capability-tree-branches"><i>Margin</i><i>Turnover</i><i>Leverage</i></span></span>;
  if (kind === "scenarios") return <span aria-hidden="true" className="capability-visual capability-visual-scenarios"><span className="capability-scenario-inputs"><i /><i /><i /></span><b>Assumptions</b><span className="capability-scenario-outcomes"><i>Upside</i><i>Base</i><i>Downside</i></span></span>;
  if (kind === "engine") return <span aria-hidden="true" className="capability-visual capability-visual-engine"><b>Input</b><span className="capability-engine-core">Model</span><span className="capability-engine-branches"><i>Ratio</i><i>DuPont</i><i>Scenario</i></span><strong>Outputs</strong></span>;
  if (kind === "ratios") return <span aria-hidden="true" className="capability-visual capability-visual-ratios"><i /><i /><i /></span>;
  return <span aria-hidden="true" className="capability-visual capability-visual-signals"><i /><i /><i /><i /></span>;
}

export function PremiumLanding({ viewModel }: { viewModel: PremiumLandingViewModel }) {
  const glowRef = useRef<HTMLDivElement>(null);
  const scrollStateRef = useRef(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateScrollState = () => {
      const nextScrolled = window.scrollY > 16;
      if (nextScrolled !== scrollStateRef.current) {
        scrollStateRef.current = nextScrolled;
        setIsScrolled(nextScrolled);
      }
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return undefined;
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 3;
    let targetX = currentX;
    let targetY = currentY;
    let frame = 0;
    const move = (event: PointerEvent) => { targetX = event.clientX; targetY = event.clientY; };
    const tick = () => {
      currentX += (targetX - currentX) * 0.045;
      currentY += (targetY - currentY) * 0.045;
      if (glowRef.current) glowRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move, { passive: true });
    frame = requestAnimationFrame(tick);
    return () => { window.removeEventListener("pointermove", move); cancelAnimationFrame(frame); };
  }, []);

  const ticker = [...viewModel.signals, ...viewModel.signals];
  return (
    <main className="landing-typography premium-shell premium-ambient min-h-screen bg-background text-neutral-50">
      <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-0 h-[520px] w-full bg-[radial-gradient(ellipse_at_50%_-10%,rgb(37_99_235/0.21),transparent_62%)]" />
      <div aria-hidden="true" className="pointer-events-none fixed z-0 hidden h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/12 blur-3xl md:block" ref={glowRef} />

      <header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
        <div className="landing-nav-glass premium-nav-glass mx-auto flex max-w-[1340px] items-center justify-between gap-4 rounded-xl px-4" data-scrolled={isScrolled || undefined}>
          <Link aria-label={`${BRAND.name} home`} className="flex shrink-0 items-center" href={BRAND.homeHref}>
            <EquiverseLogo className="h-6 w-auto sm:h-7" priority />
          </Link>
          <nav aria-label="Landing navigation" className="hidden items-center gap-5 text-caption font-semibold text-neutral-400 lg:flex">
            <a href="#capabilities">Capabilities</a><a href="#dupont">DuPont</a><a href="#scenarios">Scenarios</a><a href="#engine">Engine</a><Link href="/methodology">Methodology</Link>
          </nav>
          <Button asChild className="hidden min-h-9 shrink-0 px-3 text-caption sm:inline-flex"><Link href="/input">Launch analysis <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link></Button>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-[1340px] gap-12 px-5 pb-20 pt-20 sm:px-8 lg:grid-cols-12 lg:items-center lg:pb-28 lg:pt-28">
        <div className="premium-enter lg:col-span-6">
          <p className="premium-kicker flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_12px_#60a5fa]" /> Deterministic financial intelligence</p>
          <h1 className="mt-5 max-w-3xl break-words text-[clamp(2.15rem,6.2vw,5.7rem)] font-semibold leading-[0.98] tracking-tight text-white">Financial analysis <br className="sm:hidden" />should <span className="text-blue-300">explain <br className="sm:hidden" />what matters.</span></h1>
          <p className="landing-supporting-copy mt-5 text-[clamp(1.2rem,2vw,1.65rem)] leading-snug text-neutral-50">Not just calculate what happened.</p>
          <p className="landing-supporting-copy mt-7 max-w-xl text-body leading-7 text-neutral-50">Transform financial statements into validated ratios, a transparent Financial Health Score, deterministic insights, DuPont drivers and statement-based scenarios.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild className="px-6"><Link href="/input">Explore platform <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button><Button asChild variant="secondary" className="px-6"><Link href="/methodology">View methodology <BookOpen aria-hidden="true" className="h-4 w-4" /></Link></Button></div>
          <div className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-5 text-caption text-neutral-400 sm:grid-cols-4"><span>Validated input</span><span>Transparent score</span><span>DuPont drivers</span><span>Scenario engine</span></div>
        </div>
        <div className="premium-enter relative lg:col-span-6" style={{ animationDelay: "120ms" }}>
          <div className="crystal-surface relative overflow-hidden rounded-xl p-5 shadow-3 md:p-7">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
            <div className="flex items-start justify-between gap-4 border-b border-border pb-5"><div><p className="premium-kicker">Live product demonstration</p><p className="mt-1 text-small font-semibold">{viewModel.company} / {viewModel.year}</p></div><span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 font-mono text-caption text-blue-200">LOCAL ENGINE</span></div>
            <div className="mt-7 grid gap-7 sm:grid-cols-[1fr_0.9fr]"><div><p className="text-caption uppercase tracking-[0.12em] text-neutral-500">Financial Health Score</p><div className="mt-2 flex items-end gap-3"><span className="font-mono text-[clamp(3.7rem,8vw,5.3rem)] font-semibold leading-none tracking-tight text-white">{viewModel.score}</span><span className="mb-2 text-small font-semibold text-emerald-400">{viewModel.classification}</span></div><p className="mt-3 text-small text-neutral-400">{viewModel.coverage} analytical coverage from the canonical dataset.</p></div><div className="grid gap-3 border-l border-border pl-5">{viewModel.dimensions.slice(0, 3).map((dimension) => <div key={dimension.label}><div className="flex justify-between gap-2 text-caption"><span className="text-neutral-400">{dimension.label}</span><span className="font-mono text-neutral-200">{dimension.score}</span></div><div className="mt-1.5 h-1 overflow-hidden bg-neutral-800"><div className="h-full bg-blue-400" style={{ width: `${dimension.width}%` }} /></div></div>)}</div></div>
            <div className="mt-8 grid h-28 grid-cols-12 items-end gap-1 border-t border-border pt-5" aria-hidden="true">{[35, 47, 41, 54, 60, 56, 68, 62, 73, 78, 82, 92].map((height, index) => <span className="bg-gradient-to-t from-blue-700/30 to-blue-300/80" key={index} style={{ height: `${height}%` }} />)}</div>
          </div>
        </div>
      </section>

      <section aria-label="Illustrative analytical signal stream" className="relative z-10 overflow-hidden border-y border-border bg-[#070a0f]/90 py-4"><div className="premium-ticker-track">{ticker.map((signal, index) => <div className="flex shrink-0 items-center gap-4 border-r border-border px-8" key={`${signal.label}-${index}`}><span className="text-caption font-semibold tracking-[0.1em] text-neutral-500">{signal.label}</span><span className="font-mono text-small font-semibold text-neutral-100">{signal.value}</span><span className="text-caption text-blue-300">{signal.state}</span><span aria-hidden="true" className="h-5 w-14 border-b border-blue-400/60 [clip-path:polygon(0_70%,20%_35%,35%_55%,55%_10%,72%_43%,100%_0,100%_100%,0_100%)]" /></div>)}</div></section>

      <section className="relative z-10 mx-auto max-w-[1340px] px-5 py-24 sm:px-8"><div className="max-w-3xl"><p className="premium-kicker">From statements to decisions</p><h2 className="mt-4 text-[clamp(2rem,4.2vw,4rem)] font-semibold leading-tight tracking-tight text-white">Calculation is table stakes. Analytical context is the work.</h2><p className="landing-description mt-5 text-body-lg text-neutral-400">The product keeps every financial transformation inspectable, then connects numbers to the drivers that deserve attention.</p></div><div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-5">{["Financial statements", "Registered ratios", "Analytical signals", "DuPont drivers", "Decision context"].map((stage, index) => <div className="bg-surface p-5" key={stage}><p className="font-mono text-caption text-blue-300">0{index + 1}</p><p className="mt-6 text-small font-semibold text-neutral-100">{stage}</p>{index < 4 ? <ArrowRight aria-hidden="true" className="mt-5 h-4 w-4 text-blue-400" /> : <CircleCheck aria-hidden="true" className="mt-5 h-4 w-4 text-emerald-400" />}</div>)}</div></section>

      <section className="relative z-10 border-y border-border bg-[#070a0f]/72" id="capabilities"><div className="mx-auto max-w-[1340px] px-5 py-24 sm:px-8"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="premium-kicker">The platform</p><h2 className="mt-3 text-h1 font-semibold tracking-tight text-white">The analytical surface adapts to the question.</h2></div><p className="landing-description max-w-md text-small text-neutral-400">Every module remains connected to the same canonical financial engine and the same local-session contract.</p></div><div className="capability-bento mt-12">{capabilitySections.map((section) => <CapabilityModule key={section.id} section={section} />)}</div></div></section>

      <section className="relative z-10 mx-auto grid max-w-[1340px] gap-10 px-5 py-24 sm:px-8 lg:grid-cols-12" id="health"><div className="lg:col-span-5"><p className="premium-kicker">Financial Health</p><h2 className="mt-3 text-h1 font-semibold leading-tight tracking-tight">A score you can open up and interrogate.</h2><p className="landing-description mt-5 text-body text-neutral-400">Coverage, metric availability, dimension weights and drivers remain visible. A single score is a starting point for examination, never an unqualified verdict.</p><Button asChild variant="secondary" className="mt-7"><Link href="/analysis">Open executive dashboard <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button></div><div className="premium-panel lg:col-span-7 rounded-xl p-6"><div className="flex items-end justify-between border-b border-border pb-5"><div><p className="text-caption uppercase tracking-[0.1em] text-neutral-500">Current financial condition</p><p className="mt-2 font-mono text-5xl font-semibold tabular-nums text-white">{viewModel.score}</p></div><p className="text-right text-small font-semibold text-emerald-400">{viewModel.classification}<br /><span className="font-normal text-neutral-500">{viewModel.coverage} coverage</span></p></div><div className="mt-6 grid gap-4">{viewModel.dimensions.map((dimension) => <div className="grid gap-2 sm:grid-cols-[11rem_minmax(0,1fr)_4rem] sm:items-center" key={dimension.label}><p className="text-small text-neutral-300">{dimension.label}</p><div className="h-2 overflow-hidden rounded-full bg-neutral-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-300" style={{ width: `${dimension.width}%` }} /></div><p className="font-mono text-small text-right text-neutral-100">{dimension.score}</p></div>)}</div></div></section>

      <section className="relative z-10 border-y border-border bg-[#070a0f]/72" id="dupont"><div className="mx-auto grid max-w-[1340px] gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[0.75fr_1.25fr]"><div><p className="premium-kicker">DuPont analysis</p><h2 className="mt-3 text-h1 font-semibold leading-tight">Return on equity, decomposed.</h2><p className="landing-description mt-5 text-body text-neutral-400">The three-step identity separates operating performance, asset efficiency and financial leverage before assigning order-independent Shapley attribution.</p><Link className="mt-7 inline-flex items-center gap-2 text-small font-semibold text-blue-300" href="/analysis/dupont">Examine the drivers <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div><div className="premium-panel grid rounded-xl p-5 sm:grid-cols-7 sm:items-stretch">{viewModel.dupont.map((factor, index) => <div className="contents" key={factor.label}><article className="min-w-0 py-4 sm:px-4"><p className="text-caption uppercase tracking-[0.08em] text-neutral-500">{factor.label}</p><p className="mt-3 font-mono text-h2 font-semibold tabular-nums text-white">{factor.value}</p><p className="landing-description mt-3 text-caption leading-5 text-neutral-400">{factor.description}</p></article>{index < viewModel.dupont.length - 1 ? <span className="hidden place-items-center text-h3 text-blue-300 sm:grid">{index === 2 ? "=" : "×"}</span> : null}</div>)}</div></div></section>

      <section className="relative z-10 mx-auto grid max-w-[1340px] gap-10 px-5 py-24 sm:px-8 lg:grid-cols-12" id="scenarios"><div className="lg:col-span-7"><div className="premium-panel relative overflow-hidden rounded-xl p-7"><p className="premium-kicker">Scenario Lab</p><div className="mt-5 grid gap-8 sm:grid-cols-[1fr_auto_1fr] sm:items-center"><div><p className="text-caption uppercase text-neutral-500">Base case</p><p className="mt-2 font-mono text-5xl font-semibold text-white">{viewModel.score}</p><p className="landing-description mt-2 text-small text-neutral-400">Transparent current analysis</p></div><ArrowRight aria-hidden="true" className="hidden h-7 w-7 text-blue-300 sm:block" /><div><p className="text-caption uppercase text-blue-300">Scenario case</p><p className="mt-2 font-mono text-5xl font-semibold text-blue-100">What changes?</p><p className="landing-description mt-2 text-small text-neutral-400">Explicit assumptions through the same engine</p></div></div><div className="mt-8 grid gap-2 border-t border-border pt-5 sm:grid-cols-3"><span className="text-caption text-neutral-400">Revenue and EBIT sensitivity</span><span className="text-caption text-neutral-400">Balance sheet pressures</span><span className="text-caption text-neutral-400">No forecast claims</span></div></div></div><div className="lg:col-span-5"><p className="premium-kicker">Deliberate inputs</p><h2 className="mt-3 text-h1 font-semibold leading-tight">Explore assumptions without breaking the base case.</h2><p className="landing-description mt-5 text-body text-neutral-400">Presets and manual controls are explicit; transformed statements are revalidated before they reach analysis.</p><Button asChild variant="secondary" className="mt-7"><Link href="/scenario">Open Scenario Lab <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button></div></section>

      <div className="relative z-10" id="engine"><LandingEngineMapPreview /></div>

      <section className="relative z-10 mx-auto max-w-[1340px] px-5 py-28 text-center sm:px-8"><p className="premium-kicker">The complete analytical workspace</p><h2 className="mx-auto mt-4 max-w-4xl text-[clamp(2.4rem,5vw,5rem)] font-semibold leading-[1.02] tracking-tight">Move from financial statements to the signals worth discussing.</h2><p className="landing-description mx-auto mt-6 max-w-2xl text-body text-neutral-400">Start with a fictional demo company or enter three annual periods for your own educational analysis.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild><Link href="/input">Begin financial input <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button><Button asChild variant="secondary"><Link href="/methodology">Read the methodology</Link></Button></div></section>

      <footer className="relative z-10 border-t border-border px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-[1340px] flex-col justify-between gap-4 text-caption text-neutral-500 sm:flex-row"><span>{BRAND.name} · Educational financial analysis</span><span>No credit rating · No audit opinion · No investment recommendation</span></div></footer>
    </main>
  );
}
