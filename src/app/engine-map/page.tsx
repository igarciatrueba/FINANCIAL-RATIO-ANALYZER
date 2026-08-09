import { AppShell } from "@/components/layout/app-shell";
import { EngineMap } from "@/features/engine-map";

export default function EngineMapPage() {
  return <AppShell currentPath="/engine-map" subtitle="Interactive analytical architecture" title="Engine Map"><EngineMap /></AppShell>;
}
