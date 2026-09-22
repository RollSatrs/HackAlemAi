import { Module } from "@nestjs/common";
import { OptimizeController } from "./optimize.controller";
import { RunsController } from "./runs.controller";
import { RunsRepository } from "../persistence/runs.repository";
import { DbService } from "../persistence/db.service";

@Module({
  controllers: [OptimizeController, RunsController],
  providers: [RunsRepository, DbService],
})
export class AppModule {}
