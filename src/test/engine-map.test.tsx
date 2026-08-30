import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { formulaRegistry } from "@/domain/ratios";
import { defaultScoringConfig, dimensionOrder } from "@/domain/scoring";
import { scenarioControlOrder, scenarioPresetList } from "@/domain/scenarios";
import { EngineMap, LandingEngineMapPreview } from "@/features/engine-map";
import { buildEngineMapViewModel } from "@/features/engine-map/lib/build-engine-map-view-model";
import { getActiveConnectionIds, getActiveRouteStageIds } from "@/features/engine-map/lib/get-active-route";

describe("Engine Map architecture metadata", () => {
  it("describes unique real stages, routes and connected relationships", () => {
    const model = buildEngineMapViewModel();
    const ids = model.stages.map((stage) => stage.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(model.stages.every((stage) => stage.label && stage.purpose && stage.inputs.length && stage.outputs.length)).toBe(true);
    expect(model.connections.every((connection) => ids.includes(connection.from) && ids.includes(connection.to))).toBe(true);
    expect(new Set(model.connections.map((connection) => connection.id)).size).toBe(model.connections.length);
    expect(model.stages.find((stage) => stage.id === "scenario-lab")?.purpose).toMatch(/revalidates/i);
    expect(model.stages.find((stage) => stage.id === "dupont-analysis")?.route).toBe("/analysis/dupont");
  });

  it("derives registry and configuration counts without duplicating financial metadata", () => {
    const counts = buildEngineMapViewModel().counts;
    expect(counts.implementedRatios).toBe(Object.keys(formulaRegistry).length);
    expect(counts.scoringDimensions).toBe(dimensionOrder.length);
    expect(counts.scoredMetrics).toBe(Object.values(defaultScoringConfig.metricWeights).reduce((total, weights) => total + Object.keys(weights).length, 0));
    expect(counts.scenarioControls).toBe(scenarioControlOrder.length);
    expect(counts.scenarioPresets).toBe(scenarioPresetList.length);
  });

  it("traces an output back through its actual upstream system route", () => {
    const model = buildEngineMapViewModel();
    const activeStages = getActiveRouteStageIds(model.connections, "dupont-analysis");
    const activeConnections = getActiveConnectionIds(model.connections, activeStages);

    expect([...activeStages]).toEqual(expect.arrayContaining(["input", "validation", "derivation", "dupont", "analysis-result", "dupont-analysis"]));
    expect([...activeConnections]).toEqual(expect.arrayContaining(["input-validation", "validation-model", "model-dupont", "dupont-result", "result-dupont"]));
  });
});

describe("Engine Map interface", () => {
  it("renders a keyboard-selectable architecture graph with a contextual selected detail panel", async () => {
    const user = userEvent.setup();
    const { container } = render(<EngineMap />);

    expect(screen.getByText(/see how financial data becomes financial intelligence/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /financial input/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /analysis orchestration/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByLabelText(/^selected architecture detail$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/scenario lab re-enters the same validated engine/i)).toBeInTheDocument();
    expect(screen.getByText(/architecture flow: financial input/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /scenario lab/i }));
    expect(screen.getByRole("button", { name: /scenario lab/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText(/^selected architecture detail$/i)).toHaveTextContent(/transforms complete statement assumptions/i);
    expect(screen.getByRole("link", { name: /open scenario lab/i })).toHaveAttribute("href", "/scenario");
    await user.click(screen.getByRole("button", { name: /close selected architecture detail/i }));
    expect(screen.queryByLabelText(/^selected architecture detail$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Technical architecture detail/i).closest("details")).not.toHaveAttribute("open");
    expect(container.querySelector('[class*="w-screen"]')).toBeNull();
  });

  it("uses the same architecture definition for a condensed landing preview", async () => {
    const user = userEvent.setup();
    render(<LandingEngineMapPreview />);

    expect(screen.getByRole("heading", { name: /one engine\. many financial insights/i })).toBeInTheDocument();
    expect(screen.getByText("Analytical core")).toBeInTheDocument();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByText(/financial input:/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explore the engine/i })).toHaveAttribute("href", "/engine-map");
  });
});
