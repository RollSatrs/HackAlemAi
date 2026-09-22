import { randomUUID } from "crypto";
import { RunsRepository } from "./runs.repository";
import { ScenarioInput } from "@sandbox/shared";
import { OptimizeResult } from "../core/optimizer.service";
import { runs, candidates } from "./schema";

/**
 * Minimal hand-rolled stand-in for the Drizzle fluent query builder,
 * just enough surface area to drive RunsRepository's real code paths
 * (saveRun / listRuns / getRun) without a live Postgres connection:
 *   - insert(table).values(data).returning()
 *   - select().from(table)
 *   - select().from(table).where(condition)
 *   - select().from(table).where(condition).orderBy(column)
 *   - select().from(table).orderBy(column).limit(n)
 *
 * `where`/`orderBy`/`limit` are chainable no-ops over the in-memory rows
 * (they don't parse the real drizzle-orm `eq`/`desc` SQL fragments) — the
 * chain always resolves to whatever is currently in the fake table, in
 * insertion order. This is enough for these tests because `saveRun`
 * always inserts a single run's candidates already in rank order, and
 * each test only ever has one run's data in the fake table at a time.
 */
function makeFakeDb() {
  const runRows: any[] = [];
  const candidateRows: any[] = [];

  function tableFor(table: any) {
    return table === runs ? runRows : candidateRows;
  }

  function makeQuery(rows: any[]) {
    const chain: any = {
      where: jest.fn(() => chain),
      orderBy: jest.fn(() => chain),
      limit: jest.fn(() => chain),
      then: (resolve: any, reject: any) => Promise.resolve(rows).then(resolve, reject),
    };
    return chain;
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
      from: jest.fn((table: any) => makeQuery(tableFor(table))),
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

  it("returns the persisted top-K candidates from getRun", async () => {
    const dbService = makeFakeDbService();
    const repo = new RunsRepository(dbService as any);

    const multiCandidateResult: OptimizeResult = {
      ...result,
      candidateHistory: [
        {
          policy: [{ intersection_id: "A", ns_green_sec: 30, ew_green_sec: 30, phase_offset_sec: 0 }],
          metrics: { average_waiting_time_sec: 35, throughput_vehicles: 340 },
          fitness: 280,
        },
        {
          policy: [{ intersection_id: "A", ns_green_sec: 35, ew_green_sec: 25, phase_offset_sec: 3 }],
          metrics: { average_waiting_time_sec: 30, throughput_vehicles: 350 },
          fitness: 320,
        },
      ],
    };

    const saved = await repo.saveRun(scenario, {}, multiCandidateResult);
    const run = await repo.getRun(saved.run_id);

    expect(run).not.toBeNull();
    expect(run!.topCandidates).toHaveLength(2);
    // saveRun sorts candidateHistory by fitness descending before persisting
    // (rank 0 = highest fitness), so getRun should read them back in that order.
    expect(run!.topCandidates[0].fitness).toBe(320);
    expect(run!.topCandidates[1].fitness).toBe(280);
  });

  it("returns null from getRun when the run does not exist", async () => {
    const dbService = makeFakeDbService();
    const repo = new RunsRepository(dbService as any);
    const run = await repo.getRun(randomUUID());
    expect(run).toBeNull();
  });
});
