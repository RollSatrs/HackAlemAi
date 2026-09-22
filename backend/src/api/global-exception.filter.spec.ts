import { ArgumentsHost, BadRequestException } from "@nestjs/common";
import { GlobalExceptionFilter } from "./global-exception.filter";

function makeHost() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const response = { status };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe("GlobalExceptionFilter", () => {
  it("responds with a fixed 500 + OPTIMIZATION_FAILED body for a plain Error, without leaking its message", () => {
    const filter = new GlobalExceptionFilter();
    const { host, status, json } = makeHost();

    filter.catch(new Error("connection to postgres refused at 10.0.0.5:5432"), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: { code: "OPTIMIZATION_FAILED", message: "optimization failed" },
    });
    const [[body]] = json.mock.calls;
    expect(JSON.stringify(body)).not.toContain("postgres");
  });

  it("passes through an already contract-shaped HttpException unchanged", () => {
    const filter = new GlobalExceptionFilter();
    const { host, status, json } = makeHost();

    const exception = new BadRequestException({
      error: { code: "INVALID_INPUT", message: "duration_sec must not be greater than 3600" },
    });

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: { code: "INVALID_INPUT", message: "duration_sec must not be greater than 3600" },
    });
  });

  it("does not double-wrap and falls back to 500 for an HttpException whose body is not contract-shaped", () => {
    const filter = new GlobalExceptionFilter();
    const { host, status, json } = makeHost();

    // e.g. Nest's default NotFoundException("some message") shape.
    const exception = new BadRequestException("Bad Request");

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: { code: "OPTIMIZATION_FAILED", message: "optimization failed" },
    });
  });
});
