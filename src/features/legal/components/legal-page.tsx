import Link from "next/link";

type LegalPageProps = { title: string; eyebrow: string; children: React.ReactNode };

export function LegalPage({ title, eyebrow, children }: LegalPageProps) {
  return <main className="premium-shell premium-ambient min-h-screen px-5 py-12 text-neutral-50 sm:px-8"><article className="mx-auto max-w-3xl"><Link className="text-caption font-semibold text-blue-200 hover:text-white" href="/">Back to EQUIVERSE</Link><p className="premium-kicker mt-10">{eyebrow}</p><h1 className="mt-3 text-h1 font-semibold tracking-tight text-white">{title}</h1><div className="mt-8 grid gap-7 text-small leading-7 text-neutral-300">{children}</div></article></main>;
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="text-h4 font-semibold text-white">{title}</h2><div className="mt-2 grid gap-3">{children}</div></section>;
}
