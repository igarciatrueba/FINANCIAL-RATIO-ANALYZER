import type { EngineConnection, EngineStageId } from "@/features/engine-map/types/engine-map.types";

type Point = { x: number; y: number };

const desktopPoints: Record<EngineStageId, Point> = {
  input: { x: 9, y: 50 }, validation: { x: 25, y: 50 }, derivation: { x: 41, y: 50 },
  ratios: { x: 59, y: 14 }, dupont: { x: 59, y: 36 }, scoring: { x: 59, y: 58 }, insights: { x: 59, y: 80 },
  "analysis-result": { x: 76, y: 60 }, dashboard: { x: 91, y: 15 }, "ratio-analysis": { x: 91, y: 33 },
  "dupont-analysis": { x: 91, y: 51 }, "scenario-lab": { x: 91, y: 69 }, methodology: { x: 91, y: 87 },
};

function connectionPath(connection: EngineConnection) {
  const start = desktopPoints[connection.from];
  const end = desktopPoints[connection.to];
  const bend = start.x + (end.x - start.x) / 2;
  return `M ${start.x} ${start.y} C ${bend} ${start.y}, ${bend} ${end.y}, ${end.x} ${end.y}`;
}

export function EngineMapConnectors({ connections, activeConnectionIds }: { connections: EngineConnection[]; activeConnectionIds: Set<string> }) {
  return (
    <svg aria-hidden="true" className="architecture-connectors" preserveAspectRatio="none" viewBox="0 0 100 100">
      <defs>
        <marker id="architecture-arrow" markerHeight="4" markerWidth="4" orient="auto" refX="3.5" refY="2"><path d="M0,0 L4,2 L0,4 z" fill="currentColor" /></marker>
      </defs>
      {connections.map((connection) => {
        const active = activeConnectionIds.has(connection.id);
        return <path className="architecture-connector" data-active={active || undefined} d={connectionPath(connection)} key={connection.id} markerEnd="url(#architecture-arrow)" pathLength={1} />;
      })}
    </svg>
  );
}

export const engineMapDesktopPoints = desktopPoints;
