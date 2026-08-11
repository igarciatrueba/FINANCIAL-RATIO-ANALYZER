type PageIntroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
};

export function PageIntro({ eyebrow, title, subtitle }: PageIntroProps) {
  return (
    <section className="premium-page-intro" aria-labelledby="page-title">
      <p className="premium-kicker">{eyebrow}</p>
      <h1 className="mt-3 text-[clamp(2.15rem,4vw,4.25rem)] font-semibold leading-[1.02] tracking-tight text-white" id="page-title">{title}</h1>
      {subtitle ? <p className="mt-4 max-w-2xl text-body text-neutral-400">{subtitle}</p> : null}
    </section>
  );
}
