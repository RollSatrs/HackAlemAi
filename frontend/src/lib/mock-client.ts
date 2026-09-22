import { ApiClient } from "./api-client";
import { OptimizeRequest, OptimizeResponse, RunSummary } from "@sandbox/shared";

export class MockApiClient implements ApiClient {
  async optimize(req: OptimizeRequest): Promise<OptimizeResponse> {
    return {
      run_id: "mock-run-1",
      baseline: { average_waiting_time_sec: 41.2, throughput_vehicles: 314 },
      optimized: { average_waiting_time_sec: 29.8, throughput_vehicles: 361 },
      improvement: { waiting_time_percent: 27.7, throughput_percent: 15.0 },
      best_policy: req.scenario.intersections.map((intersection) => ({
        intersection_id: intersection.id,
        ns_green_sec: 37,
        ew_green_sec: 24,
        phase_offset_sec: 5,
      })),
    };
  }

  async listRuns(): Promise<RunSummary[]> {
    return [
      {
        run_id: "mock-run-1",
        created_at: new Date().toISOString(),
        improvement: { waiting_time_percent: 27.7, throughput_percent: 15.0 },
      },
    ];
  }
}
