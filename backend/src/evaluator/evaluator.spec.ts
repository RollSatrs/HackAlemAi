import { simulate } from "./evaluator";
import { ScenarioInput, PolicyEntry } from "@sandbox/shared";

const scenario: ScenarioInput = {
  seed: 42,
  duration_sec: 300,
  intersections: [{ id: "A", ns_arrival_rate: 0.4, ew_arrival_rate: 0.3 }],
};

const policy: PolicyEntry[] = [
  { intersection_id: "A", ns_green_sec: 30, ew_green_sec: 30, phase_offset_sec: 0 },
];

describe("simulate", () => {
  it("is deterministic for the same seed and inputs", () => {
    const first = simulate(policy, scenario);
    const second = simulate(policy, scenario);
    expect(second).toEqual(first);
  });

  it("produces different throughput for different seeds", () => {
    const other = simulate(policy, { ...scenario, seed: 7 });
    const base = simulate(policy, scenario);
    expect(other).not.toEqual(base);
  });

  it("returns non-negative metrics", () => {
    const result = simulate(policy, scenario);
    expect(result.average_waiting_time_sec).toBeGreaterThanOrEqual(0);
    expect(result.throughput_vehicles).toBeGreaterThanOrEqual(0);
  });

  it("more green time for the busier direction improves throughput", () => {
    const busyNsScenario: ScenarioInput = {
      ...scenario,
      intersections: [{ id: "A", ns_arrival_rate: 0.9, ew_arrival_rate: 0.1 }],
    };
    const balanced: PolicyEntry[] = [
      { intersection_id: "A", ns_green_sec: 30, ew_green_sec: 30, phase_offset_sec: 0 },
    ];
    const favorsNs: PolicyEntry[] = [
      { intersection_id: "A", ns_green_sec: 50, ew_green_sec: 10, phase_offset_sec: 0 },
    ];
    const balancedResult = simulate(balanced, busyNsScenario);
    const favorsNsResult = simulate(favorsNs, busyNsScenario);
    expect(favorsNsResult.average_waiting_time_sec).toBeLessThanOrEqual(
      balancedResult.average_waiting_time_sec,
    );
  });
});
