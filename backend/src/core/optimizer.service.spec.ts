import { optimize } from "./optimizer.service";
import { ScenarioInput } from "@sandbox/shared";

const scenario: ScenarioInput = {
  seed: 42,
  duration_sec: 300,
  intersections: [
    { id: "A", ns_arrival_rate: 0.4, ew_arrival_rate: 0.3 },
    { id: "B", ns_arrival_rate: 0.2, ew_arrival_rate: 0.5 },
  ],
};

describe("optimize", () => {
  it("returns baseline and optimized metrics with matching improvement sign", () => {
    const result = optimize(scenario, { candidates: 30, lambda: 1.0 });
    expect(result.baseline).toBeDefined();
    expect(result.optimized).toBeDefined();
    expect(result.bestPolicy).toHaveLength(2);
  });

  it("optimized fitness is never worse than baseline fitness", () => {
    const result = optimize(scenario, { candidates: 30, lambda: 1.0 });
    const baselineFitness =
      result.baseline.throughput_vehicles - 1.0 * result.baseline.average_waiting_time_sec;
    const optimizedFitness =
      result.optimized.throughput_vehicles - 1.0 * result.optimized.average_waiting_time_sec;
    expect(optimizedFitness).toBeGreaterThanOrEqual(baselineFitness);
  });

  it("falls back to baseline when candidates is 0", () => {
    const result = optimize(scenario, { candidates: 0, lambda: 1.0 });
    expect(result.optimized).toEqual(result.baseline);
    expect(result.bestPolicy).toEqual(
      expect.arrayContaining([expect.objectContaining({ ns_green_sec: 30, ew_green_sec: 30 })]),
    );
  });

  it("computes improvement percentages consistent with metrics", () => {
    const result = optimize(scenario, { candidates: 30, lambda: 1.0 });
    const expectedWaitingImprovement =
      result.baseline.average_waiting_time_sec === 0
        ? 0
        : ((result.baseline.average_waiting_time_sec - result.optimized.average_waiting_time_sec) /
            result.baseline.average_waiting_time_sec) *
          100;
    expect(result.improvement.waiting_time_percent).toBeCloseTo(expectedWaitingImprovement, 5);
  });

  it("uses default candidates=50 and lambda=1.0 when options omitted", () => {
    const result = optimize(scenario);
    expect(result.candidateHistory).toHaveLength(50);
  });
});
