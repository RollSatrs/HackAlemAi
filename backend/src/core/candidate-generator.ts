import { ScenarioInput, PolicyEntry } from "@sandbox/shared";
import { POLICY_BOUNDS } from "../domain/types";

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function randomInRange(rand: () => number, min: number, max: number): number {
  return Math.round(min + rand() * (max - min));
}

export function generateCandidates(
  scenario: ScenarioInput,
  count: number,
  rngSeed: number,
): PolicyEntry[][] {
  const rand = seededRandom(rngSeed);
  const candidates: PolicyEntry[][] = [];

  for (let c = 0; c < count; c++) {
    const candidate: PolicyEntry[] = scenario.intersections.map((intersection) => {
      const ns_green_sec = randomInRange(
        rand,
        POLICY_BOUNDS.minGreenSec,
        POLICY_BOUNDS.maxGreenSec,
      );
      const ew_green_sec = randomInRange(
        rand,
        POLICY_BOUNDS.minGreenSec,
        POLICY_BOUNDS.maxGreenSec,
      );
      const cycleLength = ns_green_sec + ew_green_sec;
      const phase_offset_sec = randomInRange(rand, 0, cycleLength - 1);
      return {
        intersection_id: intersection.id,
        ns_green_sec,
        ew_green_sec,
        phase_offset_sec,
      };
    });
    candidates.push(candidate);
  }

  return candidates;
}
