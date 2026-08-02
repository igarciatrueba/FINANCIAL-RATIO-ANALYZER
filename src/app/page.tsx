import Link from "next/link";
import { ArrowRight, BookOpen, Gauge, Network, ShieldCheck, SlidersHorizontal, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const capabilities = [
  {
    title: "Financial analysis",
    description: "A guided path from simplified statements to structured financial understanding.",
    icon: TrendingUp,
  },
  {
    title: "Health scoring",
    description: "A transparent score framework prepared for deterministic configuration.",
    icon: Gauge,
  },
  {
    title: "Deterministic insights",
    description: "Rules-based strengths and risks, without generative AI or black-box outputs.",
    icon: ShieldCheck,
  },
  {
    title: "Scenario modelling",
    description: "A foundation for statement-based scenario exploration in later phases.",
    icon: SlidersHorizontal,
  },
  {
    title: "Interactive architecture",
    description: "A visual map that will explain the analysis engine end to end.",
    icon: Network,
  },
  {
    title: "Methodology",
    description: "Formula and scoring documentation designed to stay close to implementation.",
    icon: BookOpen,
  },
];

const engineStages = [
  "Enter Data",
  "Validate",
  "Calculate",
  "Evaluate",
  "Explain",
  "Explore",
  "Simulate",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-neutral-50">
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 md:px-8">
          <Link className="text-small font-semibold text-neutral-50" href="/">
            Financial Ratio Analyzer
          </Link>
          <nav aria-label="Landing" className="hidden items-center gap-6 text-small text-neutral-300 md:flex">
            <Link className="hover:text-neutral-50" href="#engine-map">
              Engine Map
            </Link>
            <Link className="hover:text-neutral-50" href="#capabilities">
              Capabilities
            </Link>
            <Link className="hover:text-neutral-50" href="/methodology">
              Methodology
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1280px] gap-10 px-6 py-16 md:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)] md:px-8 md:py-24">
        <div className="flex flex-col justify-center">
          <Badge>Portfolio-quality financial intelligence</Badge>
          <h1 className="mt-6 max-w-[760px] text-h1 font-bold leading-[1.25] text-neutral-50 md:text-display md:leading-[1.2]">
            Understand a company&apos;s financial health in minutes.
          </h1>
          <p className="mt-6 max-w-[760px] text-body-lg text-neutral-300">
            Transform simplified financial statements into validated ratios, transparent methodology,
            scenario-ready analysis and an executive reporting experience.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/input">
                Start Analysis
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/analysis">Load Demo Company</Link>
            </Button>
          </div>
        </div>

        <Card className="min-h-[420px]">
          <CardHeader>
            <CardTitle>Dashboard Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="rounded-lg border border-border bg-neutral-950 p-6">
                <p className="text-caption uppercase text-neutral-400">Executive assessment</p>
                <div className="mt-4 h-32 rounded-md border border-border bg-surface" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="h-24 rounded-md border border-border bg-surface" />
                <div className="h-24 rounded-md border border-border bg-surface" />
                <div className="h-24 rounded-md border border-border bg-surface" />
              </div>
              <p className="text-small text-neutral-400">
                Final analytical charts and demo results are intentionally reserved for later phases.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="engine-map" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-8">
          <div className="max-w-[760px]">
            <Badge variant="info">Analysis Engine Map</Badge>
            <h2 className="mt-4 text-h2 font-semibold leading-[1.25] text-neutral-50">
              A visible path from statements to decision interface.
            </h2>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-7">
            {engineStages.map((stage) => (
              <div key={stage} className="rounded-md border border-border bg-background p-4">
                <p className="font-mono text-caption text-primary">Stage</p>
                <p className="mt-2 text-small font-semibold text-neutral-50">{stage}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="capabilities" className="mx-auto max-w-[1280px] px-6 py-16 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {capabilities.map((capability) => {
            const Icon = capability.icon;

            return (
              <Card key={capability.title}>
                <CardHeader>
                  <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
                  <CardTitle>{capability.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-small text-neutral-300">{capability.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
