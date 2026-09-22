import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

interface MinimalResponse {
  status(code: number): MinimalResponse;
  json(body: unknown): void;
}

/**
 * Catches everything that reaches Nest's exception layer and makes sure
 * the response body always matches the API_CONTRACT error shape
 * (`{ error: { code, message } }`).
 *
 * - HttpExceptions whose response body is already contract-shaped (the
 *   ValidationPipe's exceptionFactory, or a controller's own
 *   `new BadRequestException({ error: { code, message } })`) are passed
 *   through unchanged — this filter must not double-wrap them.
 * - Everything else (unhandled exceptions, non-HTTP errors, DB failures,
 *   etc.) is reported as a generic 500 with a fixed, non-leaky message so
 *   internal exception details never reach the client.
 */
function isContractShaped(body: unknown): body is { error: { code: string; message: string } } {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as any).error === "object" &&
    (body as any).error !== null &&
    typeof (body as any).error.code === "string"
  );
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<MinimalResponse>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (isContractShaped(body)) {
        response.status(status).json(body);
        return;
      }
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: "OPTIMIZATION_FAILED",
        message: "optimization failed",
      },
    });
  }
}
