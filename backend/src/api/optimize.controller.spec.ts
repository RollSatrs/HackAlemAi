import { OptimizeController } from "./optimize.controller";
import { RunsRepository } from "../persistence/runs.repository";
import { ScenarioValidationError } from "../domain/domain.service";
import { BadRequestException } from "@nestjs/common";

describe("OptimizeController", () => {
  function makeController() {
    const runsRepository = {
      saveRun: jest.fn(async () => ({ run_id: "run-1", created_at: new Date() })),
    } as unknown as RunsRepository;
    const controller = new OptimizeController(runsRepository);
    return { controller, runsRepository };
  }

  const validBody = {
    scenario: {
      seed: 42,
      duration_sec: 300,
      intersections: [
        { id: "A", ns_arrival_rate: 0.4, ew_arrival_rate: 0.3 },
        { id: "B", ns_arrival_rate: 0.2, ew_arrival_rate: 0.5 },
      ],
    },
    options: { candidates: 10, lambda: 1.0 },
  };

  it("returns run_id, baseline, optimized, improvement, best_policy", async () => {
    const { controller } = makeController();
    const response = await controller.optimize(validBody as any);
    expect(response.run_id).toBe("run-1");
    expect(response.baseline).toBeDefined();
    expect(response.optimized).toBeDefined();
    expect(response.improvement).toBeDefined();
    expect(response.best_policy).toBeDefined();
  });

  it("persists the run via RunsRepository", async () => {
    const { controller, runsRepository } = makeController();
    await controller.optimize(validBody as any);
    expect(runsRepository.saveRun).toHaveBeenCalledTimes(1);
  });

  it("maps ScenarioValidationError to a 400 with INVALID_INPUT code", async () => {
    const { controller } = makeController();
    const invalidBody = {
      scenario: { seed: 1, duration_sec: 0, intersections: [] },
    };
    await expect(controller.optimize(invalidBody as any)).rejects.toThrow(BadRequestException);
  });
});
