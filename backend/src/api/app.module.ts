import { Module } from "@nestjs/common";
import { OptimizeController } from "./optimize.controller";
import { RunsController } from "./runs.controller";
import { RunsRepository } from "../persistence/runs.repository";
import { PrismaService } from "../persistence/prisma.service";

@Module({
  controllers: [OptimizeController, RunsController],
  providers: [RunsRepository, PrismaService],
})
export class AppModule {}
