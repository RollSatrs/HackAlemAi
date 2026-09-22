import { fitness } from "./scoring";
import { Metrics } from "@sandbox/shared";

describe("fitness", () => {
  it("rewards higher throughput", () => {
    const low: Metrics = { average_waiting_time_sec: 10, throughput_vehicles: 100 };
    const high: Metrics = { average_waiting_time_sec: 10, throughput_vehicles: 200 };
    expect(fitness(high, 1.0)).toBeGreaterThan(fitness(low, 1.0));
  });

  it("penalizes higher waiting time", () => {
    const lowWait: Metrics = { average_waiting_time_sec: 5, throughput_vehicles: 100 };
    const highWait: Metrics = { average_waiting_time_sec: 50, throughput_vehicles: 100 };
    expect(fitness(lowWait, 1.0)).toBeGreaterThan(fitness(highWait, 1.0));
  });

  it("applies lambda as the waiting-time weight", () => {
    const metrics: Metrics = { average_waiting_time_sec: 10, throughput_vehicles: 100 };
    expect(fitness(metrics, 2.0)).toBe(100 - 2.0 * 10);
  });
});
