import { MockApiClient } from "./mock-client";
import { OptimizeRequest, OptimizeResponse, RunSummary } from "@sandbox/shared";

const request: OptimizeRequest = {
  scenario: {
    seed: 1,
    duration_sec: 100,
    intersections: [
      { id: "A", ns_arrival_rate: 0.3, ew_arrival_rate: 0.3 },
      { id: "B", ns_arrival_rate: 0.3, ew_arrival_rate: 0.3 },
    ],
  },
};

function assertOptimizeResponseShape(response: OptimizeResponse) {
  expect(typeof response.run_id).toBe("string");
  expect(typeof response.baseline.average_waiting_time_sec).toBe("number");
  expect(typeof response.baseline.throughput_vehicles).toBe("number");
  expect(typeof response.optimized.average_waiting_time_sec).toBe("number");
  expect(typeof response.improvement.waiting_time_percent).toBe("number");
  expect(Array.isArray(response.best_policy)).toBe(true);
  for (const entry of response.best_policy) {
    expect(typeof entry.intersection_id).toBe("string");
    expect(typeof entry.ns_green_sec).toBe("number");
    expect(typeof entry.ew_green_sec).toBe("number");
    expect(typeof entry.phase_offset_sec).toBe("number");
  }
}

function assertRunSummaryShape(summary: RunSummary) {
  expect(typeof summary.run_id).toBe("string");
  expect(typeof summary.created_at).toBe("string");
  expect(typeof summary.improvement.waiting_time_percent).toBe("number");
}

describe("MockApiClient contract compatibility", () => {
  it("optimize() response matches OptimizeResponse shape", async () => {
    const client = new MockApiClient();
    const response = await client.optimize(request);
    assertOptimizeResponseShape(response);
  });

  it("listRuns() response matches RunSummary[] shape", async () => {
    const client = new MockApiClient();
    const runs = await client.listRuns();
    expect(runs.length).toBeGreaterThan(0);
    runs.forEach(assertRunSummaryShape);
  });

  it("best_policy has one entry per requested intersection", async () => {
    const client = new MockApiClient();
    const response = await client.optimize(request);
    expect(response.best_policy).toHaveLength(request.scenario.intersections.length);
  });
});
