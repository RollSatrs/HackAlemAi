import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { ScenarioInput, OptimizeOptions, RunSummary } from "@sandbox/shared";
import { OptimizeResult } from "../core/optimizer.service";
import { DbService } from "./db.service";
import { runs, candidates } from "./schema";

const TOP_K_CANDIDATES = 10;

export interface RunDetail {
  run_id: string;
  created_at: Date;
  scenario: ScenarioInput;
  options: OptimizeOptions;
  baseline: OptimizeResult["baseline"];
  optimized: OptimizeResult["optimized"];
  improvement: OptimizeResult["improvement"];
  bestPolicy: OptimizeResult["bestPolicy"];
  topCandidates: OptimizeResult["candidateHistory"];
}

@Injectable()
export class RunsRepository {
  constructor(private readonly dbService: DbService) {}

  async saveRun(
    scenario: ScenarioInput,
    options: OptimizeOptions,
    result: OptimizeResult,
  ): Promise<{ run_id: string; created_at: Date }> {
    const [run] = await this.dbService.db
      .insert(runs)
      .values({
        scenario: scenario as any,
        options: options as any,
        baseline: result.baseline as any,
        optimized: result.optimized as any,
        improvement: result.improvement as any,
        bestPolicy: result.bestPolicy as any,
      })
      .returning();

    const topCandidates = [...result.candidateHistory]
      .sort((a, b) => b.fitness - a.fitness)
      .slice(0, TOP_K_CANDIDATES);

    if (topCandidates.length > 0) {
      await this.dbService.db.insert(candidates).values(
        topCandidates.map((candidate, rank) => ({
          runId: run.id,
          policy: candidate.policy as any,
          metrics: candidate.metrics as any,
          fitness: candidate.fitness,
          rank,
        })),
      );
    }

    return { run_id: run.id, created_at: run.createdAt };
  }

  async getRun(runId: string): Promise<RunDetail | null> {
    const rows = await this.dbService.db
      .select()
      .from(runs)
      .where(eq(runs.id, runId));
    const run = rows[0];
    if (!run) return null;
    return {
      run_id: run.id,
      created_at: run.createdAt,
      scenario: run.scenario as any,
      options: run.options as any,
      baseline: run.baseline as any,
      optimized: run.optimized as any,
      improvement: run.improvement as any,
      bestPolicy: run.bestPolicy as any,
      topCandidates: [],
    };
  }

  async listRuns(): Promise<RunSummary[]> {
    const rows = await this.dbService.db.select().from(runs);
    return rows.map((run: any) => ({
      run_id: run.id,
      created_at: run.createdAt.toISOString(),
      improvement: run.improvement,
    }));
  }
}
