import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/api/app.module";
import { createValidationPipe } from "../src/main";

const hasDb = !!process.env.DATABASE_URL;
const describeIfDb = hasDb ? describe : describe.skip;

describeIfDb("POST /optimize (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(createValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns a response matching the API contract for a valid scenario", async () => {
    const response = await request(app.getHttpServer())
      .post("/optimize")
      .send({
        scenario: {
          seed: 42,
          duration_sec: 200,
          intersections: [
            { id: "A", ns_arrival_rate: 0.4, ew_arrival_rate: 0.3 },
            { id: "B", ns_arrival_rate: 0.2, ew_arrival_rate: 0.5 },
          ],
        },
        options: { candidates: 10, lambda: 1.0 },
      })
      .expect(201);

    expect(response.body.run_id).toBeDefined();
    expect(response.body.baseline.average_waiting_time_sec).toBeGreaterThanOrEqual(0);
    expect(response.body.optimized.throughput_vehicles).toBeGreaterThanOrEqual(0);
    expect(response.body.improvement).toBeDefined();
    expect(Array.isArray(response.body.best_policy)).toBe(true);
  });

  it("returns INVALID_INPUT for an empty intersections array", async () => {
    const response = await request(app.getHttpServer())
      .post("/optimize")
      .send({ scenario: { seed: 1, duration_sec: 100, intersections: [] } })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_INPUT");
  });
});
