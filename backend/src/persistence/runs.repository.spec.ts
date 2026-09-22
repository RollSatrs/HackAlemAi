import { randomUUID } from "crypto";
import { RunsRepository } from "./runs.repository";
import { ScenarioInput } from "@sandbox/shared";
import { OptimizeResult } from "../core/optimizer.service";
import { runs, candidates } from "./schema";

/**
 * Minimal hand-rolled stand-in for the Drizzle fluent query builder,
 * just enough surface area to drive RunsRepository's real code paths
 * (saveRun / listRuns) without a live Postgres connection:
 *   - insert(table).values(data).returning()
 *   - select().from(table)
 *   - select().from(table).where(condition)   (not exercised by these
 *     two tests, but kept for shape-completeness / future getRun tests)
 */
function makeFakeDb() {
  const runRows: any[] = [];
  const candidateRows: any[] = [];

  function tableFor(table: any) {
    return table === runs ? runRows : candidateRows;
  }

  return {
    insert: jest.fn((table: any) => ({
      values: jest.fn((data: any) => {
        const rowsToInsert = Array.isArray(data) ? data : [data];
        const inserted = rowsToInsert.map((row) => ({
          id: randomUUID(),
          createdAt: new Date(),
          ...row,
        }));
        tableFor(table).push(...inserted);
        return {
          returning: jest.fn(async () => inserted),
        };
      }),
    })),
    select: jest.fn(() => ({
      from: jest.fn((table: any) => {
        const rows = tableFor(table);
        const result: any = Promise.resolve(rows);
        result.where = jest.fn(async () => rows);
        return result;
      }),
    })),
  };
}

function makeFakeDbService() {
  return { db: makeFakeDb() };
}

const scenario: ScenarioInput = {
  seed: 42,
  duration_sec: 300,
  intersections: [{ id: "A", ns_arrival_rate: 0.4, ew_arrival_rate: 0.3 }],
};

const result: OptimizeResult = {
  baseline: { average_waiting_time_sec: 40, throughput_vehicles: 300 },
  optimized: { average_waiting_time_sec: 30, throughput_vehicles: 350 },
  bestPolicy: [{ intersection_id: "A", ns_green_sec: 35, ew_green_sec: 25, phase_offset_sec: 3 }],
  improvement: { waiting_time_percent: 25, throughput_percent: 16.6 },
  candidateHistory: [
    {
      policy: [{ intersection_id: "A", ns_green_sec: 35, ew_green_sec: 25, phase_offset_sec: 3 }],
      metrics: { average_waiting_time_sec: 30, throughput_vehicles: 350 },
      fitness: 320,
    },
  ],
};

describe("RunsRepository", () => {
  it("saves a run and returns its id", async () => {
    const dbService = makeFakeDbService();
    const repo = new RunsRepository(dbService as any);
    const saved = await repo.saveRun(scenario, {}, result);
    expect(saved.run_id).toBeDefined();
    expect(dbService.db.insert).toHaveBeenCalledWith(runs);
    expect(dbService.db.insert).toHaveBeenCalledWith(candidates);
  });

  it("lists runs after saving", async () => {
    const dbService = makeFakeDbService();
    const repo = new RunsRepository(dbService as any);
    await repo.saveRun(scenario, {}, result);
    const list = await repo.listRuns();
    expect(list).toHaveLength(1);
    expect(list[0].improvement).toEqual(result.improvement);
  });
});
