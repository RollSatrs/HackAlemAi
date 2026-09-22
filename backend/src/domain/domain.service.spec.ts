import { validateScenario, buildBaselinePolicy, ScenarioValidationError } from "./domain.service";
import { ScenarioInput } from "@sandbox/shared";

const validScenario: ScenarioInput = {
  seed: 42,
  duration_sec: 600,
  intersections: [
    { id: "A", ns_arrival_rate: 0.4, ew_arrival_rate: 0.3 },
    { id: "B", ns_arrival_rate: 0.2, ew_arrival_rate: 0.5 },
  ],
};

describe("validateScenario", () => {
  it("accepts a valid scenario", () => {
    expect(() => validateScenario(validScenario)).not.toThrow();
  });

  it("rejects fewer than 2 intersections", () => {
    const scenario = { ...validScenario, intersections: [validScenario.intersections[0]] };
    expect(() => validateScenario(scenario)).toThrow(ScenarioValidationError);
  });

  it("rejects more than 4 intersections", () => {
    const five = Array.from({ length: 5 }, (_, i) => ({
      id: `X${i}`,
      ns_arrival_rate: 0.1,
      ew_arrival_rate: 0.1,
    }));
    expect(() => validateScenario({ ...validScenario, intersections: five })).toThrow(
      ScenarioValidationError,
    );
  });

  it("rejects arrival rate outside [0,1]", () => {
    const scenario = {
      ...validScenario,
      intersections: [{ id: "A", ns_arrival_rate: 1.5, ew_arrival_rate: 0.3 }],
    };
    expect(() => validateScenario(scenario)).toThrow(ScenarioValidationError);
  });

  it("rejects non-positive duration", () => {
    expect(() => validateScenario({ ...validScenario, duration_sec: 0 })).toThrow(
      ScenarioValidationError,
    );
  });
});

describe("buildBaselinePolicy", () => {
  it("returns fixed 30/30/0 policy per intersection", () => {
    const policy = buildBaselinePolicy(validScenario);
    expect(policy).toEqual([
      { intersection_id: "A", ns_green_sec: 30, ew_green_sec: 30, phase_offset_sec: 0 },
      { intersection_id: "B", ns_green_sec: 30, ew_green_sec: 30, phase_offset_sec: 0 },
    ]);
  });
});
