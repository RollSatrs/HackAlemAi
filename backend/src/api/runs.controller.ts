import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { RunsRepository } from "../persistence/runs.repository";

@Controller("runs")
export class RunsController {
  constructor(private readonly runsRepository: RunsRepository) {}

  @Get()
  async list() {
    return this.runsRepository.listRuns();
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const run = await this.runsRepository.getRun(id);
    if (!run) {
      throw new NotFoundException({
        error: { code: "INVALID_INPUT", message: `run ${id} not found` },
      });
    }
    return run;
  }
}
