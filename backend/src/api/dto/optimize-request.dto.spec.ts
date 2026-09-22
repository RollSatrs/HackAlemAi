import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { OptimizeRequestDto } from "./optimize-request.dto";

describe("OptimizeRequestDto", () => {
  it("passes validation for a valid payload", async () => {
    const dto = plainToInstance(OptimizeRequestDto, {
      scenario: {
        seed: 42,
        duration_sec: 300,
        intersections: [
          { id: "A", ns_arrival_rate: 0.4, ew_arrival_rate: 0.3 },
          { id: "B", ns_arrival_rate: 0.2, ew_arrival_rate: 0.5 },
        ],
      },
      options: { candidates: 20, lambda: 1.0 },
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it("fails validation when scenario is missing", async () => {
    const dto = plainToInstance(OptimizeRequestDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("fails validation when intersections is empty", async () => {
    const dto = plainToInstance(OptimizeRequestDto, {
      scenario: { seed: 1, duration_sec: 100, intersections: [] },
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
