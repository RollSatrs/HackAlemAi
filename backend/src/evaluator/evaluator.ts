import { ScenarioInput, PolicyEntry, Metrics } from "@sandbox/shared";

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

interface IntersectionResult {
  totalWaitSec: number;
  arrivals: number;
  departures: number;
}

function simulateIntersection(
  policy: PolicyEntry,
  ns_arrival_rate: number,
  ew_arrival_rate: number,
  duration_sec: number,
  seed: number,
): IntersectionResult {
  const rand = seededRandom(seed);
  const cycleLength = policy.ns_green_sec + policy.ew_green_sec;
  let nsQueue = 0;
  let ewQueue = 0;
  let totalWaitSec = 0;
  let arrivals = 0;
  let departures = 0;
  const nsQueueTimestamps: number[] = [];
  const ewQueueTimestamps: number[] = [];

  for (let t = 0; t < duration_sec; t++) {
    if (rand() < ns_arrival_rate) {
      nsQueue++;
      arrivals++;
      nsQueueTimestamps.push(t);
    }
    if (rand() < ew_arrival_rate) {
      ewQueue++;
      arrivals++;
      ewQueueTimestamps.push(t);
    }

    const cyclePos = (t + policy.phase_offset_sec) % cycleLength;
    const nsGreen = cyclePos < policy.ns_green_sec;

    if (nsGreen && nsQueue > 0) {
      nsQueue--;
      departures++;
      const arrivalTime = nsQueueTimestamps.shift();
      if (arrivalTime !== undefined) totalWaitSec += t - arrivalTime;
    } else if (!nsGreen && ewQueue > 0) {
      ewQueue--;
      departures++;
      const arrivalTime = ewQueueTimestamps.shift();
      if (arrivalTime !== undefined) totalWaitSec += t - arrivalTime;
    }
  }

  return { totalWaitSec, arrivals, departures };
}

export function simulate(policy: PolicyEntry[], scenario: ScenarioInput): Metrics {
  let totalWaitSec = 0;
  let totalArrivals = 0;
  let totalDepartures = 0;

  scenario.intersections.forEach((intersection, index) => {
    const intersectionPolicy = policy.find((p) => p.intersection_id === intersection.id);
    if (!intersectionPolicy) {
      throw new Error(`No policy entry for intersection ${intersection.id}`);
    }
    const result = simulateIntersection(
      intersectionPolicy,
      intersection.ns_arrival_rate,
      intersection.ew_arrival_rate,
      scenario.duration_sec,
      scenario.seed + index * 1000,
    );
    totalWaitSec += result.totalWaitSec;
    totalArrivals += result.arrivals;
    totalDepartures += result.departures;
  });

  return {
    average_waiting_time_sec: totalArrivals > 0 ? totalWaitSec / totalArrivals : 0,
    throughput_vehicles: totalDepartures,
  };
}
