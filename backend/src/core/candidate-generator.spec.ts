import { generateCandidates } from "./candidate-generator";
import { ScenarioInput } from "@sandbox/shared";
import { POLICY_BOUNDS } from "../domain/types";

const scenario: ScenarioInput = {
  seed: 1,
  duration_sec: 100,
  intersections: [
    { id: "A", ns_arrival_rate: 0.3, ew_arrival_rate: 0.3 },
    { id: "B", ns_arrival_rate: 0.3, ew_arrival_rate: 0.3 },
  ],
};

describe("generateCandidates", () => {
  it("generates the requested number of candidates", () => {
    const candidates = generateCandidates(scenario, 10, 5);
    expect(candidates).toHaveLength(10);
  });

  it("each candidate has one policy entry per intersection", () => {
    const candidates = generateCandidates(scenario, 5, 5);
    for (const candidate of candidates) {
      expect(candidate.map((p) => p.intersection_id).sort()).toEqual(["A", "B"]);
    }
  });

  it("respects green-time bounds", () => {
    const candidates = generateCandidates(scenario, 20, 5);
    for (const candidate of candidates) {
      for (const entry of candidate) {
        expect(entry.ns_green_sec).toBeGreaterThanOrEqual(POLICY_BOUNDS.minGreenSec);
        expect(entry.ns_green_sec).toBeLessThanOrEqual(POLICY_BOUNDS.maxGreenSec);
        expect(entry.ew_green_sec).toBeGreaterThanOrEqual(POLICY_BOUNDS.minGreenSec);
        expect(entry.ew_green_sec).toBeLessThanOrEqual(POLICY_BOUNDS.maxGreenSec);
        expect(entry.phase_offset_sec).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("is deterministic for the same rngSeed", () => {
    const a = generateCandidates(scenario, 5, 9);
    const b = generateCandidates(scenario, 5, 9);
    expect(b).toEqual(a);
  });
});
