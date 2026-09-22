import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { OptimizeRequestDto } from "./dto/optimize-request.dto";
import { OptimizeResponse } from "@sandbox/shared";
import { optimize } from "../core/optimizer.service";
import { validateScenario, ScenarioValidationError } from "../domain/domain.service";
import { RunsRepository } from "../persistence/runs.repository";

@Controller()
export class OptimizeController {
  constructor(private readonly runsRepository: RunsRepository) {}

  @Post("optimize")
  async optimize(@Body() body: OptimizeRequestDto): Promise<OptimizeResponse> {
    try {
      validateScenario(body.scenario as any);
    } catch (err) {
      if (err instanceof ScenarioValidationError) {
        throw new BadRequestException({ error: { code: "INVALID_INPUT", message: err.message } });
      }
      throw err;
    }

    const result = optimize(body.scenario as any, body.options as any);
    const saved = await this.runsRepository.saveRun(
      body.scenario as any,
      body.options as any,
      result,
    );

    return {
      run_id: saved.run_id,
      baseline: result.baseline,
      optimized: result.optimized,
      improvement: result.improvement,
      best_policy: result.bestPolicy,
    };
  }
}
