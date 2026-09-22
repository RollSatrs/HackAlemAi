import { RunsRepository } from "./runs.repository";
import { ScenarioInput } from "@sandbox/shared";
import { OptimizeResult } from "../core/optimizer.service";

function makeFakePrisma() {
  const runs: any[] = [];
  const candidates: any[] = [];
  return {
    run: {
      create: jest.fn(async ({ data }: any) => {
        const record = { id: "run-1", createdAt: new Date(), ...data };
        runs.push(record);
        return record;
      }),
      findUnique: jest.fn(async ({ where }: any) =>
        runs.find((r) => r.id === where.id) ?? null,
      ),
      findMany: jest.fn(async () => runs),
    },
    candidate: {
      createMany: jest.fn(async ({ data }: any) => {
        candidates.push(...data);
        return { count: data.length };
      }),
    },
  };
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
    const prisma = makeFakePrisma();
    const repo = new RunsRepository(prisma as any);
    const saved = await repo.saveRun(scenario, {}, result);
    expect(saved.run_id).toBeDefined();
    expect(prisma.run.create).toHaveBeenCalledTimes(1);
    expect(prisma.candidate.createMany).toHaveBeenCalledTimes(1);
  });

  it("lists runs after saving", async () => {
    const prisma = makeFakePrisma();
    const repo = new RunsRepository(prisma as any);
    await repo.saveRun(scenario, {}, result);
    const list = await repo.listRuns();
    expect(list).toHaveLength(1);
    expect(list[0].improvement).toEqual(result.improvement);
  });
});
