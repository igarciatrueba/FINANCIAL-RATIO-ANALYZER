import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RoutePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function RoutePlaceholder({ eyebrow, title, description }: RoutePlaceholderProps) {
  return (
    <section className="grid gap-6">
      <div className="max-w-[760px]">
        <Badge variant="info">{eyebrow}</Badge>
        <h2 className="mt-4 text-h2 font-semibold leading-[1.25] text-neutral-50">{title}</h2>
        <p className="mt-4 text-body text-neutral-300">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foundation placeholder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-28 rounded-md border border-border bg-neutral-950" />
            <div className="h-28 rounded-md border border-border bg-neutral-950" />
            <div className="h-28 rounded-md border border-border bg-neutral-950" />
          </div>
          <p className="mt-6 text-small text-neutral-400">
            Analytical calculations, demo data, charts and scenario behaviour are intentionally not implemented in Phase 1.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
