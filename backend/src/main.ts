import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { BadRequestException, ValidationError, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./api/app.module";
import { GlobalExceptionFilter } from "./api/global-exception.filter";

export function validationErrorsToMessage(errors: ValidationError[]): string {
  const messages: string[] = [];

  const collect = (error: ValidationError): void => {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }
    if (error.children && error.children.length > 0) {
      error.children.forEach(collect);
    }
  };

  errors.forEach(collect);

  return messages.length > 0 ? messages.join("; ") : "Validation failed";
}

export function validationExceptionFactory(errors: ValidationError[]): BadRequestException {
  return new BadRequestException({
    error: {
      code: "INVALID_INPUT",
      message: validationErrorsToMessage(errors),
    },
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: validationExceptionFactory,
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
}

if (require.main === module) {
  bootstrap();
}
