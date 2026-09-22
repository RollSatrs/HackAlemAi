import {
  pgTable,
  uuid,
  timestamp,
  jsonb,
  real,
  integer,
} from "drizzle-orm/pg-core";

export const runs = pgTable("runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  scenario: jsonb("scenario").notNull(),
  options: jsonb("options").notNull(),
  baseline: jsonb("baseline").notNull(),
  optimized: jsonb("optimized").notNull(),
  improvement: jsonb("improvement").notNull(),
  bestPolicy: jsonb("best_policy").notNull(),
});

export const candidates = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id")
    .notNull()
    .references(() => runs.id),
  policy: jsonb("policy").notNull(),
  metrics: jsonb("metrics").notNull(),
  fitness: real("fitness").notNull(),
  rank: integer("rank").notNull(),
});

export type RunRow = typeof runs.$inferSelect;
export type NewRunRow = typeof runs.$inferInsert;
export type CandidateRow = typeof candidates.$inferSelect;
export type NewCandidateRow = typeof candidates.$inferInsert;
