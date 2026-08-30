import type { EngineConnection, EngineStageId } from "@/features/engine-map/types/engine-map.types";

export function getActiveRouteStageIds(connections: EngineConnection[], selectedStageId: EngineStageId) {
  const active = new Set<EngineStageId>([selectedStageId]);
  const visit = (stageId: EngineStageId, direction: "upstream" | "downstream") => {
    const next = connections
      .filter((connection) => direction === "upstream" ? connection.to === stageId : connection.from === stageId)
      .map((connection) => direction === "upstream" ? connection.from : connection.to);

    for (const stage of next) {
      if (!active.has(stage)) {
        active.add(stage);
        visit(stage, direction);
      }
    }
  };

  visit(selectedStageId, "upstream");
  visit(selectedStageId, "downstream");
  return active;
}

export function getActiveConnectionIds(connections: EngineConnection[], activeStageIds: Set<EngineStageId>) {
  return new Set(
    connections
      .filter((connection) => activeStageIds.has(connection.from) && activeStageIds.has(connection.to))
      .map((connection) => connection.id)
  );
}
