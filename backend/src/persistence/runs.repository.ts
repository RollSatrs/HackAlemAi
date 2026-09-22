import { Injectable } from "@nestjs/common";
import { ScenarioInput, OptimizeOptions, RunSummary } from "@sandbox/shared";
import { OptimizeResult } from "../core/optimizer.service";
import { PrismaService } from "./prisma.service";

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
  constructor(private readonly prisma: PrismaService) {}

  async saveRun(
    scenario: ScenarioInput,
    options: OptimizeOptions,
    result: OptimizeResult,
  ): Promise<{ run_id: string; created_at: Date }> {
    const run = await this.prisma.run.create({
      data: {
        scenario: scenario as any,
        options: options as any,
        baseline: result.baseline as any,
        optimized: result.optimized as any,
        improvement: result.improvement as any,
        bestPolicy: result.bestPolicy as any,
      },
    });

    const topCandidates = [...result.candidateHistory]
      .sort((a, b) => b.fitness - a.fitness)
      .slice(0, TOP_K_CANDIDATES);

    if (topCandidates.length > 0) {
      await this.prisma.candidate.createMany({
        data: topCandidates.map((candidate, rank) => ({
          runId: run.id,
          policy: candidate.policy as any,
          metrics: candidate.metrics as any,
          fitness: candidate.fitness,
          rank,
        })),
      });
    }

    return { run_id: run.id, created_at: run.createdAt };
  }

  async getRun(runId: string): Promise<RunDetail | null> {
    const run = await this.prisma.run.findUnique({ where: { id: runId } });
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
    const runs = await this.prisma.run.findMany();
    return runs.map((run: any) => ({
      run_id: run.id,
      created_at: run.createdAt.toISOString(),
      improvement: run.improvement,
    }));
  }
}
