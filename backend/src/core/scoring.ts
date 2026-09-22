import { Metrics } from "@sandbox/shared";

export function fitness(metrics: Metrics, lambda: number): number {
  return metrics.throughput_vehicles - lambda * metrics.average_waiting_time_sec;
}
