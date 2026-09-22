import { ScenarioInput, OptimizeOptions, Metrics, PolicyEntry, Improvement } from "@sandbox/shared";
import { buildBaselinePolicy } from "../domain/domain.service";
import { simulate } from "../evaluator/evaluator";
import { generateCandidates } from "./candidate-generator";
import { fitness } from "./scoring";

export interface CandidateRecord {
  policy: PolicyEntry[];
  metrics: Metrics;
  fitness: number;
}

export interface OptimizeResult {
  baseline: Metrics;
  optimized: Metrics;
  bestPolicy: PolicyEntry[];
  improvement: Improvement;
  candidateHistory: CandidateRecord[];
}

function computeImprovement(baseline: Metrics, optimized: Metrics): Improvement {
  const waiting_time_percent =
    baseline.average_waiting_time_sec === 0
      ? 0
      : ((baseline.average_waiting_time_sec - optimized.average_waiting_time_sec) /
          baseline.average_waiting_time_sec) *
        100;
  const throughput_percent =
    baseline.throughput_vehicles === 0
      ? 0
      : ((optimized.throughput_vehicles - baseline.throughput_vehicles) /
          baseline.throughput_vehicles) *
        100;
  return { waiting_time_percent, throughput_percent };
}

export function optimize(scenario: ScenarioInput, options: OptimizeOptions = {}): OptimizeResult {
  const candidateCount = options.candidates ?? 50;
  const lambda = options.lambda ?? 1.0;

  const baselinePolicy = buildBaselinePolicy(scenario);
  const baselineMetrics = simulate(baselinePolicy, scenario);

  if (candidateCount <= 0) {
    return {
      baseline: baselineMetrics,
      optimized: baselineMetrics,
      bestPolicy: baselinePolicy,
      improvement: computeImprovement(baselineMetrics, baselineMetrics),
      candidateHistory: [],
    };
  }

  const candidates = generateCandidates(scenario, candidateCount, scenario.seed);
  const candidateHistory: CandidateRecord[] = candidates.map((policy) => {
    const metrics = simulate(policy, scenario);
    return { policy, metrics, fitness: fitness(metrics, lambda) };
  });

  const baselineFitness = fitness(baselineMetrics, lambda);
  const best = candidateHistory.reduce(
    (acc, candidate) => (candidate.fitness > acc.fitness ? candidate : acc),
    { policy: baselinePolicy, metrics: baselineMetrics, fitness: baselineFitness },
  );

  return {
    baseline: baselineMetrics,
    optimized: best.metrics,
    bestPolicy: best.policy,
    improvement: computeImprovement(baselineMetrics, best.metrics),
    candidateHistory,
  };
}
