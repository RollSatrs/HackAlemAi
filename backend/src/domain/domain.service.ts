import { ScenarioInput, PolicyEntry } from "@sandbox/shared";
import { INTERSECTION_COUNT_BOUNDS } from "./types";

export class ScenarioValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScenarioValidationError";
  }
}

export function validateScenario(scenario: ScenarioInput): void {
  const count = scenario.intersections.length;
  if (count < INTERSECTION_COUNT_BOUNDS.min || count > INTERSECTION_COUNT_BOUNDS.max) {
    throw new ScenarioValidationError(
      `intersections must have between ${INTERSECTION_COUNT_BOUNDS.min} and ${INTERSECTION_COUNT_BOUNDS.max} entries, got ${count}`,
    );
  }
  if (scenario.duration_sec <= 0) {
    throw new ScenarioValidationError("duration_sec must be positive");
  }
  for (const intersection of scenario.intersections) {
    if (intersection.ns_arrival_rate < 0 || intersection.ns_arrival_rate > 1) {
      throw new ScenarioValidationError(
        `ns_arrival_rate for ${intersection.id} must be in [0,1]`,
      );
    }
    if (intersection.ew_arrival_rate < 0 || intersection.ew_arrival_rate > 1) {
      throw new ScenarioValidationError(
        `ew_arrival_rate for ${intersection.id} must be in [0,1]`,
      );
    }
  }
}

export function buildBaselinePolicy(scenario: ScenarioInput): PolicyEntry[] {
  return scenario.intersections.map((intersection) => ({
    intersection_id: intersection.id,
    ns_green_sec: 30,
    ew_green_sec: 30,
    phase_offset_sec: 0,
  }));
}
