import { ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { OptimizeRequestDto } from "./api/dto/optimize-request.dto";
import {
  createValidationPipe,
  validationErrorsToMessage,
  validationExceptionFactory,
} from "./main";

describe("validationExceptionFactory", () => {
  it("wraps class-validator errors in the API_CONTRACT error shape", async () => {
    const dto = plainToInstance(OptimizeRequestDto, {
      scenario: { seed: 1, duration_sec: 100, intersections: [] },
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    const exception = validationExceptionFactory(errors);

    expect(exception).toBeInstanceOf(BadRequestException);
    expect(exception.getStatus()).toBe(400);
    expect(exception.getResponse()).toEqual({
      error: {
        code: "INVALID_INPUT",
        message: expect.any(String),
      },
    });
  });

  it("produces a non-empty combined message from nested constraint errors", async () => {
    const dto = plainToInstance(OptimizeRequestDto, {});
    const errors = await validate(dto);
    const message = validationErrorsToMessage(errors);

    expect(typeof message).toBe("string");
    expect(message.length).toBeGreaterThan(0);
  });

  it("falls back to a generic message when no constraints are present", () => {
    const message = validationErrorsToMessage([]);
    expect(message).toBe("Validation failed");
  });
});

describe("createValidationPipe (integration with ValidationPipe.transform)", () => {
  it("throws a BadRequestException with {error:{code,message}} body when the pipe rejects an invalid payload", async () => {
    const pipe = createValidationPipe();
    const metadata: ArgumentMetadata = {
      type: "body",
      metatype: OptimizeRequestDto,
      data: "",
    };

    await expect(
      pipe.transform({ scenario: { seed: 1, duration_sec: 0, intersections: [] } }, metadata),
    ).rejects.toMatchObject({
      response: {
        error: {
          code: "INVALID_INPUT",
          message: expect.any(String),
        },
      },
      status: 400,
    });
  });

  it("passes through a valid payload without throwing", async () => {
    const pipe = createValidationPipe();
    const metadata: ArgumentMetadata = {
      type: "body",
      metatype: OptimizeRequestDto,
      data: "",
    };

    const result = await pipe.transform(
      {
        scenario: {
          seed: 42,
          duration_sec: 300,
          intersections: [
            { id: "A", ns_arrival_rate: 0.4, ew_arrival_rate: 0.3 },
            { id: "B", ns_arrival_rate: 0.2, ew_arrival_rate: 0.5 },
          ],
        },
      },
      metadata,
    );

    expect(result).toBeInstanceOf(OptimizeRequestDto);
  });
});
