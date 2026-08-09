import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { formulaRegistry } from "@/domain/ratios";
import { defaultScoringConfig, dimensionOrder } from "@/domain/scoring";
import { scenarioControlOrder, scenarioPresetList } from "@/domain/scenarios";
import { EngineMap } from "@/features/engine-map";
import { buildEngineMapViewModel } from "@/features/engine-map/lib/build-engine-map-view-model";

describe("Phase 9 Engine Map metadata", () => {
  it("describes unique connected stages with real responsibilities", () => {
    const model = buildEngineMapViewModel();
    const ids = model.stages.map((stage) => stage.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(model.stages.every((stage) => stage.label && stage.purpose && stage.inputs.length && stage.outputs.length)).toBe(true);
    expect(model.connections.every((connection) => ids.includes(connection.from) && ids.includes(connection.to))).toBe(true);
    expect(new Set(model.connections.map((connection) => `${connection.from}:${connection.to}`)).size).toBe(model.connections.length);
    expect(new Set(model.connections.flatMap((connection) => [connection.from, connection.to]))).toEqual(new Set(ids));
  });

  it("derives registry and configuration counts without duplicating financial metadata", () => {
    const counts = buildEngineMapViewModel().counts;
    expect(counts.implementedRatios).toBe(Object.keys(formulaRegistry).length);
    expect(counts.scoringDimensions).toBe(dimensionOrder.length);
    expect(counts.scoredMetrics).toBe(Object.values(defaultScoringConfig.metricWeights).reduce((total, weights) => total + Object.keys(weights).length, 0));
    expect(counts.scenarioControls).toBe(scenarioControlOrder.length);
    expect(counts.scenarioPresets).toBe(scenarioPresetList.length);
  });

  it("shows the scenario path reconnecting to canonical validation and the same analysis engine", () => {
    const model = buildEngineMapViewModel();
    expect(model.scenarioReuse.steps).toEqual(expect.arrayContaining(["Base Case", "ScenarioAssumptions", "applyScenario()", "Canonical validation", "Same analysis engine"]));
    expect(model.scenarioReuse.statement).toMatch(/transforms statements, not analytical outputs/i);
  });
});

describe("Phase 9 Engine Map interface", () => {
  it("renders the pipeline, lets keyboard users select a stage, and keeps technical detail secondary", async () => {
    const user = userEvent.setup();
    const { container } = render(<EngineMap />);

    expect(screen.getByText(/one analytical engine, many experiences/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /financial input/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /canonical validation/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Scenario Lab transforms statements, not analytical outputs/i)).toBeInTheDocument();
    expect(screen.getByText("Executive Dashboard")).toBeInTheDocument();
    expect(screen.getByText("DuPont Analysis")).toBeInTheDocument();
    expect(screen.getByText("Scenario Lab")).toBeInTheDocument();

    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: /financial input/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText(/selected engine stage detail/i)).toHaveTextContent(/Capture company context/i);
    expect(screen.getByText(/Technical architecture detail/i).closest("details")).not.toHaveAttribute("open");
    expect(container.querySelector('[class*="w-screen"]')).toBeNull();
  });
});
