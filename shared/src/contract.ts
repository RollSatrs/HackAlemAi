export interface IntersectionInput {
  id: string;
  ns_arrival_rate: number;
  ew_arrival_rate: number;
}

export interface ScenarioInput {
  seed: number;
  duration_sec: number;
  intersections: IntersectionInput[];
}

export interface OptimizeOptions {
  candidates?: number;
  lambda?: number;
}

export interface OptimizeRequest {
  scenario: ScenarioInput;
  options?: OptimizeOptions;
}

export interface Metrics {
  average_waiting_time_sec: number;
  throughput_vehicles: number;
}

export interface PolicyEntry {
  intersection_id: string;
  ns_green_sec: number;
  ew_green_sec: number;
  phase_offset_sec: number;
}

export interface Improvement {
  waiting_time_percent: number;
  throughput_percent: number;
}

export interface OptimizeResponse {
  run_id: string;
  baseline: Metrics;
  optimized: Metrics;
  improvement: Improvement;
  best_policy: PolicyEntry[];
}

export type ApiErrorCode = "INVALID_INPUT" | "EVALUATOR_TIMEOUT" | "OPTIMIZATION_FAILED";

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export interface RunSummary {
  run_id: string;
  created_at: string;
  improvement: Improvement;
}
