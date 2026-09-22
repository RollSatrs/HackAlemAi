# Traffic Sandbox Dry-Run Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working monorepo prototype (NestJS backend + Next.js frontend) that runs an adaptive traffic-signal optimization sandbox: baseline fixed-timing vs. optimized policy found by random/grid search over a deterministic multi-intersection simulation, exposed via `POST /optimize` and visualized as baseline-vs-optimized comparison.

**Architecture:** Layered backend (`domain` -> `evaluator` -> `core` -> `api` -> `persistence`) with pure, independently-testable `domain`/`evaluator`/`core` modules; a thin NestJS API wiring them together and persisting runs to PostgreSQL via Prisma; a Next.js frontend consuming the same contract via a `shared` TypeScript types package, with a mock that must match the contract exactly.

**Tech Stack:** NestJS + TypeScript (backend), PostgreSQL + Prisma (persistence), Next.js + TypeScript (frontend), recharts (charts), Jest (unit + e2e tests), npm workspaces (monorepo).

**Spec:** `docs/superpowers/specs/2026-09-22-traffic-sandbox-design.md`

## Global Constraints

- Backend: NestJS (TypeScript), PostgreSQL via Drizzle ORM. (spec §3, §5 — amended from Prisma to Drizzle after Task 7; see SDD ledger "Mid-flight scope change")
- Frontend: Next.js (TypeScript). (spec §3)
- Intersections per scenario: 2–4. (spec §9)
- Policy bounds: `ns_green_sec`, `ew_green_sec` ∈ [10, 60]; `phase_offset_sec` ∈ [0, cycle_length). (spec §2)
- Optimizer: random/grid search, default `candidates = 50`, not GA. (spec §2, §9)
- Fitness: `throughput - λ * average_waiting_time`, default `λ = 1.0`, both configurable via `options`. (spec §2)
- Evaluator must be deterministic: same `seed` + same inputs -> same output. (spec §2, §7)
- API request/response shapes must exactly match `docs/API_CONTRACT.md` (updated 2026-09-22). (spec §5)
- Error codes: `INVALID_INPUT`, `EVALUATOR_TIMEOUT`, `OPTIMIZATION_FAILED`, shape `{ "error": { "code", "message" } }`. (spec §6)
- No auth, no deployment, no GA, no real map data. (spec §9)
- Frontend mock must byte-for-byte match the real response shape (shared TS type). (spec §7, `frontend/AGENTS.md`)

---

## File Structure

```
package.json                        # npm workspaces root
tsconfig.base.json                  # shared TS compiler options

shared/
  package.json
  tsconfig.json
  src/
    contract.ts                     # TS types mirroring docs/API_CONTRACT.md
    index.ts

backend/
  package.json
  tsconfig.json
  nest-cli.json
  prisma/
    schema.prisma
  src/
    domain/
      types.ts                      # Scenario, Intersection, Policy, Constraints
      domain.service.ts             # buildBaselinePolicy(), validateScenario()
      domain.service.spec.ts
    evaluator/
      evaluator.ts                  # simulate(policy, scenario) -> Metrics
      evaluator.spec.ts
    core/
      candidate-generator.ts        # generateCandidates(scenario, options) -> Policy[]
      candidate-generator.spec.ts
      scoring.ts                    # fitness(metrics, lambda) -> number
      scoring.spec.ts
      optimizer.service.ts          # optimize(scenario, options) -> OptimizeResult
      optimizer.service.spec.ts
    persistence/
      prisma.service.ts
      runs.repository.ts
      runs.repository.spec.ts
    api/
      dto/optimize-request.dto.ts
      dto/optimize-request.dto.spec.ts
      optimize.controller.ts
      optimize.controller.spec.ts   # e2e-style, mocked services
      runs.controller.ts
      app.module.ts
    main.ts
  test/
    optimize.e2e-spec.ts            # full app, real modules, test DB or in-memory

frontend/
  package.json
  tsconfig.json
  next.config.js
  src/
    app/
      page.tsx                      # scenario form + trigger
      runs/page.tsx                 # history list
    components/
      ScenarioForm.tsx
      ComparisonChart.tsx
      RunHistoryTable.tsx
    lib/
      api-client.ts                 # calls backend, typed with shared/contract
      mock-client.ts                # mock matching contract exactly
    lib/api-client.spec.ts
    lib/mock-contract.spec.ts       # asserts mock shape === real contract type
```

---

## Task 1: Monorepo scaffolding

**Files:**
- Create: `package.json` (root, npm workspaces: `shared`, `backend`, `frontend`)
- Create: `tsconfig.base.json`
- Create: `shared/package.json`, `shared/tsconfig.json`, `shared/src/index.ts`
- Create: `.gitignore` additions for `node_modules`, `dist`, `.next`

**Interfaces:**
- Produces: npm workspace root that `npm install` from repo root sets up `shared`, `backend`, `frontend` as linked workspaces.

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "hackalem-traffic-sandbox",
  "private": true,
  "workspaces": ["shared", "backend", "frontend"],
  "scripts": {
    "test": "npm run test --workspaces --if-present",
    "build": "npm run build --workspaces --if-present"
  }
}
```

- [ ] **Step 2: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 3: Scaffold `shared` package**

`shared/package.json`:
```json
{
  "name": "@sandbox/shared",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json"
  }
}
```

`shared/tsconfig.json`:
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

`shared/src/index.ts`:
```typescript
export * from "./contract";
```

- [ ] **Step 4: Append to `.gitignore`**

```
node_modules/
dist/
.next/
*.tsbuildinfo
```

- [ ] **Step 5: Verify workspace install**

Run: `npm install`
Expected: completes without error, creates root `node_modules` with workspace symlinks.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.base.json shared/package.json shared/tsconfig.json shared/src/index.ts .gitignore
git commit -m "chore: scaffold npm workspaces monorepo"
```

---

## Task 2: Shared contract types

**Files:**
- Create: `shared/src/contract.ts`

**Interfaces:**
- Produces:
  - `IntersectionInput { id: string; ns_arrival_rate: number; ew_arrival_rate: number }`
  - `ScenarioInput { seed: number; duration_sec: number; intersections: IntersectionInput[] }`
  - `OptimizeOptions { candidates?: number; lambda?: number }`
  - `OptimizeRequest { scenario: ScenarioInput; options?: OptimizeOptions }`
  - `Metrics { average_waiting_time_sec: number; throughput_vehicles: number }`
  - `PolicyEntry { intersection_id: string; ns_green_sec: number; ew_green_sec: number; phase_offset_sec: number }`
  - `Improvement { waiting_time_percent: number; throughput_percent: number }`
  - `OptimizeResponse { run_id: string; baseline: Metrics; optimized: Metrics; improvement: Improvement; best_policy: PolicyEntry[] }`
  - `ApiError { error: { code: "INVALID_INPUT" | "EVALUATOR_TIMEOUT" | "OPTIMIZATION_FAILED"; message: string } }`
  - `RunSummary { run_id: string; created_at: string; improvement: Improvement }`

- [ ] **Step 1: Write `shared/src/contract.ts`**

```typescript
export interface IntersectionInput {
  id: string;
  ns_arrival_rate: number;
  ew_arrival_rate: number;
}

export interface ScenarioInput {
  seed: number;
  duration_sec: number;
  intersections: IntersectionInput[];
}

export interface OptimizeOptions {
  candidates?: number;
  lambda?: number;
}

export interface OptimizeRequest {
  scenario: ScenarioInput;
  options?: OptimizeOptions;
}

export interface Metrics {
  average_waiting_time_sec: number;
  throughput_vehicles: number;
}

export interface PolicyEntry {
  intersection_id: string;
  ns_green_sec: number;
  ew_green_sec: number;
  phase_offset_sec: number;
}

export interface Improvement {
  waiting_time_percent: number;
  throughput_percent: number;
}

export interface OptimizeResponse {
  run_id: string;
  baseline: Metrics;
  optimized: Metrics;
  improvement: Improvement;
  best_policy: PolicyEntry[];
}

export type ApiErrorCode = "INVALID_INPUT" | "EVALUATOR_TIMEOUT" | "OPTIMIZATION_FAILED";

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export interface RunSummary {
  run_id: string;
  created_at: string;
  improvement: Improvement;
}
```

- [ ] **Step 2: Build shared package**

Run: `npm run build -w shared`
Expected: compiles cleanly, `shared/dist/contract.js` and `.d.ts` exist.

- [ ] **Step 3: Commit**

```bash
git add shared/src/contract.ts
git commit -m "feat(shared): add API contract types"
```

---

## Task 3: Domain adapter — scenario validation and baseline policy

**Files:**
- Create: `backend/src/domain/types.ts`
- Create: `backend/src/domain/domain.service.ts`
- Test: `backend/src/domain/domain.service.spec.ts`

**Interfaces:**
- Consumes: `IntersectionInput`, `ScenarioInput`, `PolicyEntry` from `@sandbox/shared`.
- Produces:
  - `POLICY_BOUNDS = { minGreenSec: 10, maxGreenSec: 60 }`
  - `class ScenarioValidationError extends Error { constructor(message: string) }`
  - `validateScenario(scenario: ScenarioInput): void` — throws `ScenarioValidationError` if `intersections.length` not in [2,4], any `*_arrival_rate` not in [0,1], or `duration_sec <= 0`.
  - `buildBaselinePolicy(scenario: ScenarioInput): PolicyEntry[]` — returns one entry per intersection with `ns_green_sec: 30, ew_green_sec: 30, phase_offset_sec: 0`.

This task assumes backend scaffolding exists — bundled here since domain has no NestJS dependencies and can be developed/tested standalone; NestJS wiring happens in Task 7.

- [ ] **Step 1: Scaffold backend package (minimal, no Nest CLI needed yet)**

`backend/package.json`:
```json
{
  "name": "@sandbox/backend",
  "version": "0.1.0",
  "scripts": {
    "test": "jest",
    "build": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "@sandbox/shared": "*"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "rootDir": "src"
  }
}
```

`backend/tsconfig.json`:
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src"]
}
```

Run: `npm install` (from repo root, picks up new workspace deps)

- [ ] **Step 2: Write `backend/src/domain/types.ts`**

```typescript
export const POLICY_BOUNDS = {
  minGreenSec: 10,
  maxGreenSec: 60,
} as const;

export const INTERSECTION_COUNT_BOUNDS = { min: 2, max: 4 } as const;
```

- [ ] **Step 3: Write failing test `backend/src/domain/domain.service.spec.ts`**

```typescript
import { validateScenario, buildBaselinePolicy, ScenarioValidationError } from "./domain.service";
import { ScenarioInput } from "@sandbox/shared";

const validScenario: ScenarioInput = {
  seed: 42,
  duration_sec: 600,
  intersections: [
    { id: "A", ns_arrival_rate: 0.4, ew_arrival_rate: 0.3 },
    { id: "B", ns_arrival_rate: 0.2, ew_arrival_rate: 0.5 },
  ],
};

describe("validateScenario", () => {
  it("accepts a valid scenario", () => {
    expect(() => validateScenario(validScenario)).not.toThrow();
  });

  it("rejects fewer than 2 intersections", () => {
    const scenario = { ...validScenario, intersections: [validScenario.intersections[0]] };
    expect(() => validateScenario(scenario)).toThrow(ScenarioValidationError);
  });

  it("rejects more than 4 intersections", () => {
    const five = Array.from({ length: 5 }, (_, i) => ({
      id: `X${i}`,
      ns_arrival_rate: 0.1,
      ew_arrival_rate: 0.1,
    }));
    expect(() => validateScenario({ ...validScenario, intersections: five })).toThrow(
      ScenarioValidationError,
    );
  });

  it("rejects arrival rate outside [0,1]", () => {
    const scenario = {
      ...validScenario,
      intersections: [{ id: "A", ns_arrival_rate: 1.5, ew_arrival_rate: 0.3 }],
    };
    expect(() => validateScenario(scenario)).toThrow(ScenarioValidationError);
  });

  it("rejects non-positive duration", () => {
    expect(() => validateScenario({ ...validScenario, duration_sec: 0 })).toThrow(
      ScenarioValidationError,
    );
  });
});

describe("buildBaselinePolicy", () => {
  it("returns fixed 30/30/0 policy per intersection", () => {
    const policy = buildBaselinePolicy(validScenario);
    expect(policy).toEqual([
      { intersection_id: "A", ns_green_sec: 30, ew_green_sec: 30, phase_offset_sec: 0 },
      { intersection_id: "B", ns_green_sec: 30, ew_green_sec: 30, phase_offset_sec: 0 },
    ]);
  });
});
```

- [ ] **Step 4: Run test, verify it fails**

Run: `npm run test -w backend -- domain.service.spec.ts`
Expected: FAIL — `Cannot find module './domain.service'`

- [ ] **Step 5: Write `backend/src/domain/domain.service.ts`**

```typescript
import { ScenarioInput, PolicyEntry } from "@sandbox/shared";
import { INTERSECTION_COUNT_BOUNDS } from "./types";

export class ScenarioValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScenarioValidationError";
  }
}

export function validateScenario(scenario: ScenarioInput): void {
  const count = scenario.intersections.length;
  if (count < INTERSECTION_COUNT_BOUNDS.min || count > INTERSECTION_COUNT_BOUNDS.max) {
    throw new ScenarioValidationError(
      `intersections must have between ${INTERSECTION_COUNT_BOUNDS.min} and ${INTERSECTION_COUNT_BOUNDS.max} entries, got ${count}`,
    );
  }
  if (scenario.duration_sec <= 0) {
    throw new ScenarioValidationError("duration_sec must be positive");
  }
  for (const intersection of scenario.intersections) {
    if (intersection.ns_arrival_rate < 0 || intersection.ns_arrival_rate > 1) {
      throw new ScenarioValidationError(
        `ns_arrival_rate for ${intersection.id} must be in [0,1]`,
      );
    }
    if (intersection.ew_arrival_rate < 0 || intersection.ew_arrival_rate > 1) {
      throw new ScenarioValidationError(
        `ew_arrival_rate for ${intersection.id} must be in [0,1]`,
      );
    }
  }
}

export function buildBaselinePolicy(scenario: ScenarioInput): PolicyEntry[] {
  return scenario.intersections.map((intersection) => ({
    intersection_id: intersection.id,
    ns_green_sec: 30,
    ew_green_sec: 30,
    phase_offset_sec: 0,
  }));
}
```

- [ ] **Step 6: Run test, verify it passes**

Run: `npm run test -w backend -- domain.service.spec.ts`
Expected: PASS, 5 tests green.

- [ ] **Step 7: Commit**

```bash
git add backend/package.json backend/tsconfig.json backend/src/domain
git commit -m "feat(backend): add domain adapter with scenario validation and baseline policy"
```

---

## Task 4: Evaluator — deterministic simulation

**Files:**
- Create: `backend/src/evaluator/evaluator.ts`
- Test: `backend/src/evaluator/evaluator.spec.ts`

**Interfaces:**
- Consumes: `ScenarioInput`, `PolicyEntry`, `Metrics` from `@sandbox/shared`.
- Produces: `simulate(policy: PolicyEntry[], scenario: ScenarioInput): Metrics`

Simulation model: for each intersection, run a per-second discrete loop over `duration_sec`. A seeded linear-congruential PRNG (seeded from `scenario.seed` + intersection index) decides, each second, whether a vehicle arrives on NS (prob = `ns_arrival_rate`) and EW (prob = `ew_arrival_rate`). Each second belongs to either an NS-green or EW-green phase based on a repeating cycle of length `ns_green_sec + ew_green_sec`, offset by `phase_offset_sec`. Vehicles that arrive during their approach's green phase depart immediately (throughput+1); vehicles that arrive during red are queued and depart (in FIFO order) once green starts, one per second, up to remaining green capacity. Aggregate `average_waiting_time_sec` (mean over all vehicles that arrived) and `throughput_vehicles` (total departed) across all intersections.

- [ ] **Step 1: Write failing test `backend/src/evaluator/evaluator.spec.ts`**

```typescript
import { simulate } from "./evaluator";
import { ScenarioInput, PolicyEntry } from "@sandbox/shared";

const scenario: ScenarioInput = {
  seed: 42,
  duration_sec: 300,
  intersections: [{ id: "A", ns_arrival_rate: 0.4, ew_arrival_rate: 0.3 }],
};

const policy: PolicyEntry[] = [
  { intersection_id: "A", ns_green_sec: 30, ew_green_sec: 30, phase_offset_sec: 0 },
];

describe("simulate", () => {
  it("is deterministic for the same seed and inputs", () => {
    const first = simulate(policy, scenario);
    const second = simulate(policy, scenario);
    expect(second).toEqual(first);
  });

  it("produces different throughput for different seeds", () => {
    const other = simulate(policy, { ...scenario, seed: 7 });
    const base = simulate(policy, scenario);
    expect(other).not.toEqual(base);
  });

  it("returns non-negative metrics", () => {
    const result = simulate(policy, scenario);
    expect(result.average_waiting_time_sec).toBeGreaterThanOrEqual(0);
    expect(result.throughput_vehicles).toBeGreaterThanOrEqual(0);
  });

  it("more green time for the busier direction improves throughput", () => {
    const busyNsScenario: ScenarioInput = {
      ...scenario,
      intersections: [{ id: "A", ns_arrival_rate: 0.9, ew_arrival_rate: 0.1 }],
    };
    const balanced: PolicyEntry[] = [
      { intersection_id: "A", ns_green_sec: 30, ew_green_sec: 30, phase_offset_sec: 0 },
    ];
    const favorsNs: PolicyEntry[] = [
      { intersection_id: "A", ns_green_sec: 50, ew_green_sec: 10, phase_offset_sec: 0 },
    ];
    const balancedResult = simulate(balanced, busyNsScenario);
    const favorsNsResult = simulate(favorsNs, busyNsScenario);
    expect(favorsNsResult.average_waiting_time_sec).toBeLessThanOrEqual(
      balancedResult.average_waiting_time_sec,
    );
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test -w backend -- evaluator.spec.ts`
Expected: FAIL — `Cannot find module './evaluator'`

- [ ] **Step 3: Write `backend/src/evaluator/evaluator.ts`**

```typescript
import { ScenarioInput, PolicyEntry, Metrics } from "@sandbox/shared";

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

interface IntersectionResult {
  totalWaitSec: number;
  arrivals: number;
  departures: number;
}

function simulateIntersection(
  policy: PolicyEntry,
  ns_arrival_rate: number,
  ew_arrival_rate: number,
  duration_sec: number,
  seed: number,
): IntersectionResult {
  const rand = seededRandom(seed);
  const cycleLength = policy.ns_green_sec + policy.ew_green_sec;
  let nsQueue = 0;
  let ewQueue = 0;
  let totalWaitSec = 0;
  let arrivals = 0;
  let departures = 0;
  const nsQueueTimestamps: number[] = [];
  const ewQueueTimestamps: number[] = [];

  for (let t = 0; t < duration_sec; t++) {
    if (rand() < ns_arrival_rate) {
      nsQueue++;
      arrivals++;
      nsQueueTimestamps.push(t);
    }
    if (rand() < ew_arrival_rate) {
      ewQueue++;
      arrivals++;
      ewQueueTimestamps.push(t);
    }

    const cyclePos = (t + policy.phase_offset_sec) % cycleLength;
    const nsGreen = cyclePos < policy.ns_green_sec;

    if (nsGreen && nsQueue > 0) {
      nsQueue--;
      departures++;
      const arrivalTime = nsQueueTimestamps.shift();
      if (arrivalTime !== undefined) totalWaitSec += t - arrivalTime;
    } else if (!nsGreen && ewQueue > 0) {
      ewQueue--;
      departures++;
      const arrivalTime = ewQueueTimestamps.shift();
      if (arrivalTime !== undefined) totalWaitSec += t - arrivalTime;
    }
  }

  return { totalWaitSec, arrivals, departures };
}

export function simulate(policy: PolicyEntry[], scenario: ScenarioInput): Metrics {
  let totalWaitSec = 0;
  let totalArrivals = 0;
  let totalDepartures = 0;

  scenario.intersections.forEach((intersection, index) => {
    const intersectionPolicy = policy.find((p) => p.intersection_id === intersection.id);
    if (!intersectionPolicy) {
      throw new Error(`No policy entry for intersection ${intersection.id}`);
    }
    const result = simulateIntersection(
      intersectionPolicy,
      intersection.ns_arrival_rate,
      intersection.ew_arrival_rate,
      scenario.duration_sec,
      scenario.seed + index * 1000,
    );
    totalWaitSec += result.totalWaitSec;
    totalArrivals += result.arrivals;
    totalDepartures += result.departures;
  });

  return {
    average_waiting_time_sec: totalArrivals > 0 ? totalWaitSec / totalArrivals : 0,
    throughput_vehicles: totalDepartures,
  };
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test -w backend -- evaluator.spec.ts`
Expected: PASS, 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add backend/src/evaluator
git commit -m "feat(backend): add deterministic multi-intersection evaluator"
```

---

## Task 5: Core — candidate generation, scoring, optimizer

**Files:**
- Create: `backend/src/core/candidate-generator.ts`
- Test: `backend/src/core/candidate-generator.spec.ts`
- Create: `backend/src/core/scoring.ts`
- Test: `backend/src/core/scoring.spec.ts`
- Create: `backend/src/core/optimizer.service.ts`
- Test: `backend/src/core/optimizer.service.spec.ts`

**Interfaces:**
- Consumes: `simulate` from `../evaluator/evaluator`, `validateScenario`/`buildBaselinePolicy` from `../domain/domain.service`, types from `@sandbox/shared`.
- Produces:
  - `generateCandidates(scenario: ScenarioInput, count: number, rngSeed: number): PolicyEntry[][]`
  - `fitness(metrics: Metrics, lambda: number): number`
  - `interface OptimizeResult { baseline: Metrics; optimized: Metrics; bestPolicy: PolicyEntry[]; improvement: Improvement; candidateHistory: { policy: PolicyEntry[]; metrics: Metrics; fitness: number }[] }`
  - `optimize(scenario: ScenarioInput, options?: OptimizeOptions): OptimizeResult`

- [ ] **Step 1: Write failing test `backend/src/core/candidate-generator.spec.ts`**

```typescript
import { generateCandidates } from "./candidate-generator";
import { ScenarioInput } from "@sandbox/shared";
import { POLICY_BOUNDS } from "../domain/types";

const scenario: ScenarioInput = {
  seed: 1,
  duration_sec: 100,
  intersections: [
    { id: "A", ns_arrival_rate: 0.3, ew_arrival_rate: 0.3 },
    { id: "B", ns_arrival_rate: 0.3, ew_arrival_rate: 0.3 },
  ],
};

describe("generateCandidates", () => {
  it("generates the requested number of candidates", () => {
    const candidates = generateCandidates(scenario, 10, 5);
    expect(candidates).toHaveLength(10);
  });

  it("each candidate has one policy entry per intersection", () => {
    const candidates = generateCandidates(scenario, 5, 5);
    for (const candidate of candidates) {
      expect(candidate.map((p) => p.intersection_id).sort()).toEqual(["A", "B"]);
    }
  });

  it("respects green-time bounds", () => {
    const candidates = generateCandidates(scenario, 20, 5);
    for (const candidate of candidates) {
      for (const entry of candidate) {
        expect(entry.ns_green_sec).toBeGreaterThanOrEqual(POLICY_BOUNDS.minGreenSec);
        expect(entry.ns_green_sec).toBeLessThanOrEqual(POLICY_BOUNDS.maxGreenSec);
        expect(entry.ew_green_sec).toBeGreaterThanOrEqual(POLICY_BOUNDS.minGreenSec);
        expect(entry.ew_green_sec).toBeLessThanOrEqual(POLICY_BOUNDS.maxGreenSec);
        expect(entry.phase_offset_sec).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("is deterministic for the same rngSeed", () => {
    const a = generateCandidates(scenario, 5, 9);
    const b = generateCandidates(scenario, 5, 9);
    expect(b).toEqual(a);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test -w backend -- candidate-generator.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `backend/src/core/candidate-generator.ts`**

```typescript
import { ScenarioInput, PolicyEntry } from "@sandbox/shared";
import { POLICY_BOUNDS } from "../domain/types";

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function randomInRange(rand: () => number, min: number, max: number): number {
  return Math.round(min + rand() * (max - min));
}

export function generateCandidates(
  scenario: ScenarioInput,
  count: number,
  rngSeed: number,
): PolicyEntry[][] {
  const rand = seededRandom(rngSeed);
  const candidates: PolicyEntry[][] = [];

  for (let c = 0; c < count; c++) {
    const candidate: PolicyEntry[] = scenario.intersections.map((intersection) => {
      const ns_green_sec = randomInRange(
        rand,
        POLICY_BOUNDS.minGreenSec,
        POLICY_BOUNDS.maxGreenSec,
      );
      const ew_green_sec = randomInRange(
        rand,
        POLICY_BOUNDS.minGreenSec,
        POLICY_BOUNDS.maxGreenSec,
      );
      const cycleLength = ns_green_sec + ew_green_sec;
      const phase_offset_sec = randomInRange(rand, 0, cycleLength - 1);
      return {
        intersection_id: intersection.id,
        ns_green_sec,
        ew_green_sec,
        phase_offset_sec,
      };
    });
    candidates.push(candidate);
  }

  return candidates;
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test -w backend -- candidate-generator.spec.ts`
Expected: PASS, 4 tests green.

- [ ] **Step 5: Write failing test `backend/src/core/scoring.spec.ts`**

```typescript
import { fitness } from "./scoring";
import { Metrics } from "@sandbox/shared";

describe("fitness", () => {
  it("rewards higher throughput", () => {
    const low: Metrics = { average_waiting_time_sec: 10, throughput_vehicles: 100 };
    const high: Metrics = { average_waiting_time_sec: 10, throughput_vehicles: 200 };
    expect(fitness(high, 1.0)).toBeGreaterThan(fitness(low, 1.0));
  });

  it("penalizes higher waiting time", () => {
    const lowWait: Metrics = { average_waiting_time_sec: 5, throughput_vehicles: 100 };
    const highWait: Metrics = { average_waiting_time_sec: 50, throughput_vehicles: 100 };
    expect(fitness(lowWait, 1.0)).toBeGreaterThan(fitness(highWait, 1.0));
  });

  it("applies lambda as the waiting-time weight", () => {
    const metrics: Metrics = { average_waiting_time_sec: 10, throughput_vehicles: 100 };
    expect(fitness(metrics, 2.0)).toBe(100 - 2.0 * 10);
  });
});
```

- [ ] **Step 6: Run test, verify it fails**

Run: `npm run test -w backend -- scoring.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 7: Write `backend/src/core/scoring.ts`**

```typescript
import { Metrics } from "@sandbox/shared";

export function fitness(metrics: Metrics, lambda: number): number {
  return metrics.throughput_vehicles - lambda * metrics.average_waiting_time_sec;
}
```

- [ ] **Step 8: Run test, verify it passes**

Run: `npm run test -w backend -- scoring.spec.ts`
Expected: PASS, 3 tests green.

- [ ] **Step 9: Write failing test `backend/src/core/optimizer.service.spec.ts`**

```typescript
import { optimize } from "./optimizer.service";
import { ScenarioInput } from "@sandbox/shared";

const scenario: ScenarioInput = {
  seed: 42,
  duration_sec: 300,
  intersections: [
    { id: "A", ns_arrival_rate: 0.4, ew_arrival_rate: 0.3 },
    { id: "B", ns_arrival_rate: 0.2, ew_arrival_rate: 0.5 },
  ],
};

describe("optimize", () => {
  it("returns baseline and optimized metrics with matching improvement sign", () => {
    const result = optimize(scenario, { candidates: 30, lambda: 1.0 });
    expect(result.baseline).toBeDefined();
    expect(result.optimized).toBeDefined();
    expect(result.bestPolicy).toHaveLength(2);
  });

  it("optimized fitness is never worse than baseline fitness", () => {
    const result = optimize(scenario, { candidates: 30, lambda: 1.0 });
    const baselineFitness =
      result.baseline.throughput_vehicles - 1.0 * result.baseline.average_waiting_time_sec;
    const optimizedFitness =
      result.optimized.throughput_vehicles - 1.0 * result.optimized.average_waiting_time_sec;
    expect(optimizedFitness).toBeGreaterThanOrEqual(baselineFitness);
  });

  it("falls back to baseline when candidates is 0", () => {
    const result = optimize(scenario, { candidates: 0, lambda: 1.0 });
    expect(result.optimized).toEqual(result.baseline);
    expect(result.bestPolicy).toEqual(
      expect.arrayContaining([expect.objectContaining({ ns_green_sec: 30, ew_green_sec: 30 })]),
    );
  });

  it("computes improvement percentages consistent with metrics", () => {
    const result = optimize(scenario, { candidates: 30, lambda: 1.0 });
    const expectedWaitingImprovement =
      result.baseline.average_waiting_time_sec === 0
        ? 0
        : ((result.baseline.average_waiting_time_sec - result.optimized.average_waiting_time_sec) /
            result.baseline.average_waiting_time_sec) *
          100;
    expect(result.improvement.waiting_time_percent).toBeCloseTo(expectedWaitingImprovement, 5);
  });

  it("uses default candidates=50 and lambda=1.0 when options omitted", () => {
    const result = optimize(scenario);
    expect(result.candidateHistory).toHaveLength(50);
  });
});
```

- [ ] **Step 10: Run test, verify it fails**

Run: `npm run test -w backend -- optimizer.service.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 11: Write `backend/src/core/optimizer.service.ts`**

```typescript
import { ScenarioInput, OptimizeOptions, Metrics, PolicyEntry, Improvement } from "@sandbox/shared";
import { buildBaselinePolicy } from "../domain/domain.service";
import { simulate } from "../evaluator/evaluator";
import { generateCandidates } from "./candidate-generator";
import { fitness } from "./scoring";

export interface CandidateRecord {
  policy: PolicyEntry[];
  metrics: Metrics;
  fitness: number;
}

export interface OptimizeResult {
  baseline: Metrics;
  optimized: Metrics;
  bestPolicy: PolicyEntry[];
  improvement: Improvement;
  candidateHistory: CandidateRecord[];
}

function computeImprovement(baseline: Metrics, optimized: Metrics): Improvement {
  const waiting_time_percent =
    baseline.average_waiting_time_sec === 0
      ? 0
      : ((baseline.average_waiting_time_sec - optimized.average_waiting_time_sec) /
          baseline.average_waiting_time_sec) *
        100;
  const throughput_percent =
    baseline.throughput_vehicles === 0
      ? 0
      : ((optimized.throughput_vehicles - baseline.throughput_vehicles) /
          baseline.throughput_vehicles) *
        100;
  return { waiting_time_percent, throughput_percent };
}

export function optimize(scenario: ScenarioInput, options: OptimizeOptions = {}): OptimizeResult {
  const candidateCount = options.candidates ?? 50;
  const lambda = options.lambda ?? 1.0;

  const baselinePolicy = buildBaselinePolicy(scenario);
  const baselineMetrics = simulate(baselinePolicy, scenario);

  if (candidateCount <= 0) {
    return {
      baseline: baselineMetrics,
      optimized: baselineMetrics,
      bestPolicy: baselinePolicy,
      improvement: computeImprovement(baselineMetrics, baselineMetrics),
      candidateHistory: [],
    };
  }

  const candidates = generateCandidates(scenario, candidateCount, scenario.seed);
  const candidateHistory: CandidateRecord[] = candidates.map((policy) => {
    const metrics = simulate(policy, scenario);
    return { policy, metrics, fitness: fitness(metrics, lambda) };
  });

  const baselineFitness = fitness(baselineMetrics, lambda);
  const best = candidateHistory.reduce(
    (acc, candidate) => (candidate.fitness > acc.fitness ? candidate : acc),
    { policy: baselinePolicy, metrics: baselineMetrics, fitness: baselineFitness },
  );

  return {
    baseline: baselineMetrics,
    optimized: best.metrics,
    bestPolicy: best.policy,
    improvement: computeImprovement(baselineMetrics, best.metrics),
    candidateHistory,
  };
}
```

- [ ] **Step 12: Run test, verify it passes**

Run: `npm run test -w backend -- optimizer.service.spec.ts`
Expected: PASS, 5 tests green.

- [ ] **Step 13: Commit**

```bash
git add backend/src/core
git commit -m "feat(backend): add candidate generation, fitness scoring, and optimizer"
```

---

## Task 6: Persistence — Prisma schema and runs repository

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/src/persistence/prisma.service.ts`
- Create: `backend/src/persistence/runs.repository.ts`
- Test: `backend/src/persistence/runs.repository.spec.ts`

**Interfaces:**
- Consumes: `OptimizeResult` (Task 5), `ScenarioInput`.
- Produces:
  - `class PrismaService extends PrismaClient implements OnModuleInit`
  - `class RunsRepository { saveRun(scenario, options, result): Promise<{ run_id: string; created_at: Date }>; getRun(runId: string): Promise<RunDetail | null>; listRuns(): Promise<RunSummary[]> }`

- [ ] **Step 1: Add Prisma dependencies**

Add to `backend/package.json` `dependencies`: `"@prisma/client": "^5.14.0"`; `devDependencies`: `"prisma": "^5.14.0"`.

Run: `npm install`

- [ ] **Step 2: Write `backend/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Run {
  id              String   @id @default(uuid())
  createdAt       DateTime @default(now())
  scenario        Json
  options         Json
  baseline        Json
  optimized       Json
  improvement     Json
  bestPolicy      Json
  candidates      Candidate[]
}

model Candidate {
  id            String   @id @default(uuid())
  runId         String
  run           Run      @relation(fields: [runId], references: [id])
  policy        Json
  metrics       Json
  fitness       Float
  rank          Int
}
```

- [ ] **Step 3: Write failing test `backend/src/persistence/runs.repository.spec.ts`**

Uses an in-memory fake of the Prisma client shape to avoid requiring a live DB in unit tests (a real-DB check happens in the e2e test in Task 7).

```typescript
import { RunsRepository } from "./runs.repository";
import { ScenarioInput } from "@sandbox/shared";
import { OptimizeResult } from "../core/optimizer.service";

function makeFakePrisma() {
  const runs: any[] = [];
  const candidates: any[] = [];
  return {
    run: {
      create: jest.fn(async ({ data }: any) => {
        const record = { id: "run-1", createdAt: new Date(), ...data };
        runs.push(record);
        return record;
      }),
      findUnique: jest.fn(async ({ where }: any) =>
        runs.find((r) => r.id === where.id) ?? null,
      ),
      findMany: jest.fn(async () => runs),
    },
    candidate: {
      createMany: jest.fn(async ({ data }: any) => {
        candidates.push(...data);
        return { count: data.length };
      }),
    },
  };
}

const scenario: ScenarioInput = {
  seed: 42,
  duration_sec: 300,
  intersections: [{ id: "A", ns_arrival_rate: 0.4, ew_arrival_rate: 0.3 }],
};

const result: OptimizeResult = {
  baseline: { average_waiting_time_sec: 40, throughput_vehicles: 300 },
  optimized: { average_waiting_time_sec: 30, throughput_vehicles: 350 },
  bestPolicy: [{ intersection_id: "A", ns_green_sec: 35, ew_green_sec: 25, phase_offset_sec: 3 }],
  improvement: { waiting_time_percent: 25, throughput_percent: 16.6 },
  candidateHistory: [
    {
      policy: [{ intersection_id: "A", ns_green_sec: 35, ew_green_sec: 25, phase_offset_sec: 3 }],
      metrics: { average_waiting_time_sec: 30, throughput_vehicles: 350 },
      fitness: 320,
    },
  ],
};

describe("RunsRepository", () => {
  it("saves a run and returns its id", async () => {
    const prisma = makeFakePrisma();
    const repo = new RunsRepository(prisma as any);
    const saved = await repo.saveRun(scenario, {}, result);
    expect(saved.run_id).toBeDefined();
    expect(prisma.run.create).toHaveBeenCalledTimes(1);
    expect(prisma.candidate.createMany).toHaveBeenCalledTimes(1);
  });

  it("lists runs after saving", async () => {
    const prisma = makeFakePrisma();
    const repo = new RunsRepository(prisma as any);
    await repo.saveRun(scenario, {}, result);
    const list = await repo.listRuns();
    expect(list).toHaveLength(1);
    expect(list[0].improvement).toEqual(result.improvement);
  });
});
```

- [ ] **Step 4: Run test, verify it fails**

Run: `npm run test -w backend -- runs.repository.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 5: Write `backend/src/persistence/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

- [ ] **Step 6: Write `backend/src/persistence/runs.repository.ts`**

Keeps only the top 10 candidates by fitness to bound storage (spec §5 "top-K").

```typescript
import { Injectable } from "@nestjs/common";
import { ScenarioInput, OptimizeOptions, RunSummary } from "@sandbox/shared";
import { OptimizeResult } from "../core/optimizer.service";
import { PrismaService } from "./prisma.service";

const TOP_K_CANDIDATES = 10;

export interface RunDetail {
  run_id: string;
  created_at: Date;
  scenario: ScenarioInput;
  options: OptimizeOptions;
  baseline: OptimizeResult["baseline"];
  optimized: OptimizeResult["optimized"];
  improvement: OptimizeResult["improvement"];
  bestPolicy: OptimizeResult["bestPolicy"];
  topCandidates: OptimizeResult["candidateHistory"];
}

@Injectable()
export class RunsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveRun(
    scenario: ScenarioInput,
    options: OptimizeOptions,
    result: OptimizeResult,
  ): Promise<{ run_id: string; created_at: Date }> {
    const run = await this.prisma.run.create({
      data: {
        scenario: scenario as any,
        options: options as any,
        baseline: result.baseline as any,
        optimized: result.optimized as any,
        improvement: result.improvement as any,
        bestPolicy: result.bestPolicy as any,
      },
    });

    const topCandidates = [...result.candidateHistory]
      .sort((a, b) => b.fitness - a.fitness)
      .slice(0, TOP_K_CANDIDATES);

    if (topCandidates.length > 0) {
      await this.prisma.candidate.createMany({
        data: topCandidates.map((candidate, rank) => ({
          runId: run.id,
          policy: candidate.policy as any,
          metrics: candidate.metrics as any,
          fitness: candidate.fitness,
          rank,
        })),
      });
    }

    return { run_id: run.id, created_at: run.createdAt };
  }

  async getRun(runId: string): Promise<RunDetail | null> {
    const run = await this.prisma.run.findUnique({ where: { id: runId } });
    if (!run) return null;
    return {
      run_id: run.id,
      created_at: run.createdAt,
      scenario: run.scenario as any,
      options: run.options as any,
      baseline: run.baseline as any,
      optimized: run.optimized as any,
      improvement: run.improvement as any,
      bestPolicy: run.bestPolicy as any,
      topCandidates: [],
    };
  }

  async listRuns(): Promise<RunSummary[]> {
    const runs = await this.prisma.run.findMany();
    return runs.map((run: any) => ({
      run_id: run.id,
      created_at: run.createdAt.toISOString(),
      improvement: run.improvement,
    }));
  }
}
```

- [ ] **Step 7: Run test, verify it passes**

Run: `npm run test -w backend -- runs.repository.spec.ts`
Expected: PASS, 2 tests green.

- [ ] **Step 8: Commit**

```bash
git add backend/package.json backend/prisma backend/src/persistence
git commit -m "feat(backend): add Prisma schema and runs repository"
```

---

## Task 7: API — NestJS DTOs, controllers, and e2e test

**Files:**
- Create: `backend/src/api/dto/optimize-request.dto.ts`
- Test: `backend/src/api/dto/optimize-request.dto.spec.ts`
- Create: `backend/src/api/optimize.controller.ts`
- Test: `backend/src/api/optimize.controller.spec.ts`
- Create: `backend/src/api/runs.controller.ts`
- Create: `backend/src/api/app.module.ts`
- Create: `backend/src/main.ts`
- Test: `backend/test/optimize.e2e-spec.ts`

**Interfaces:**
- Consumes: `optimize` (Task 5), `RunsRepository` (Task 6), `ScenarioValidationError` (Task 3).
- Produces: running NestJS app exposing `POST /optimize`, `GET /runs`, `GET /runs/:id` matching `docs/API_CONTRACT.md`.

- [ ] **Step 1: Add NestJS dependencies**

Add to `backend/package.json` `dependencies`: `"@nestjs/common": "^10.3.0"`, `"@nestjs/core": "^10.3.0"`, `"@nestjs/platform-express": "^10.3.0"`, `"class-validator": "^0.14.0"`, `"class-transformer": "^0.5.1"`, `"reflect-metadata": "^0.2.0"`, `"rxjs": "^7.8.0"`; `devDependencies`: `"@nestjs/testing": "^10.3.0"`, `"supertest": "^6.3.0"`, `"@types/supertest": "^6.0.0"`.

Run: `npm install`

- [ ] **Step 2: Write failing test `backend/src/api/dto/optimize-request.dto.spec.ts`**

```typescript
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
```

- [ ] **Step 3: Run test, verify it fails**

Run: `npm run test -w backend -- optimize-request.dto.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Write `backend/src/api/dto/optimize-request.dto.ts`**

```typescript
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class IntersectionInputDto {
  @IsString()
  id!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  ns_arrival_rate!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  ew_arrival_rate!: number;
}

export class ScenarioInputDto {
  @IsInt()
  seed!: number;

  @IsInt()
  @Min(1)
  duration_sec!: number;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => IntersectionInputDto)
  intersections!: IntersectionInputDto[];
}

export class OptimizeOptionsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  candidates?: number;

  @IsOptional()
  @IsNumber()
  lambda?: number;
}

export class OptimizeRequestDto {
  @ValidateNested()
  @Type(() => ScenarioInputDto)
  scenario!: ScenarioInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OptimizeOptionsDto)
  options?: OptimizeOptionsDto;
}
```

- [ ] **Step 5: Run test, verify it passes**

Run: `npm run test -w backend -- optimize-request.dto.spec.ts`
Expected: PASS, 3 tests green.

- [ ] **Step 6: Write failing test `backend/src/api/optimize.controller.spec.ts`**

```typescript
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
```

- [ ] **Step 7: Run test, verify it fails**

Run: `npm run test -w backend -- optimize.controller.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 8: Write `backend/src/api/optimize.controller.ts`**

```typescript
import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { OptimizeRequestDto } from "./dto/optimize-request.dto";
import { OptimizeResponse } from "@sandbox/shared";
import { optimize } from "../core/optimizer.service";
import { validateScenario, ScenarioValidationError } from "../domain/domain.service";
import { RunsRepository } from "../persistence/runs.repository";

@Controller()
export class OptimizeController {
  constructor(private readonly runsRepository: RunsRepository) {}

  @Post("optimize")
  async optimize(@Body() body: OptimizeRequestDto): Promise<OptimizeResponse> {
    try {
      validateScenario(body.scenario as any);
    } catch (err) {
      if (err instanceof ScenarioValidationError) {
        throw new BadRequestException({ error: { code: "INVALID_INPUT", message: err.message } });
      }
      throw err;
    }

    const result = optimize(body.scenario as any, body.options as any);
    const saved = await this.runsRepository.saveRun(
      body.scenario as any,
      body.options as any,
      result,
    );

    return {
      run_id: saved.run_id,
      baseline: result.baseline,
      optimized: result.optimized,
      improvement: result.improvement,
      best_policy: result.bestPolicy,
    };
  }
}
```

- [ ] **Step 9: Run test, verify it passes**

Run: `npm run test -w backend -- optimize.controller.spec.ts`
Expected: PASS, 3 tests green.

- [ ] **Step 10: Write `backend/src/api/runs.controller.ts`**

```typescript
import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { RunsRepository } from "../persistence/runs.repository";

@Controller("runs")
export class RunsController {
  constructor(private readonly runsRepository: RunsRepository) {}

  @Get()
  async list() {
    return this.runsRepository.listRuns();
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const run = await this.runsRepository.getRun(id);
    if (!run) {
      throw new NotFoundException({
        error: { code: "INVALID_INPUT", message: `run ${id} not found` },
      });
    }
    return run;
  }
}
```

- [ ] **Step 11: Write `backend/src/api/app.module.ts`**

```typescript
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
```

- [ ] **Step 12: Write `backend/src/main.ts`**

```typescript
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./api/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

- [ ] **Step 13: Write e2e test `backend/test/optimize.e2e-spec.ts`**

Requires `DATABASE_URL` pointing at a real or test PostgreSQL instance (documented in Task 9 README update). Skips gracefully if unset, so unit-test-only environments still pass the rest of the suite.

```typescript
import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/api/app.module";

const hasDb = !!process.env.DATABASE_URL;
const describeIfDb = hasDb ? describe : describe.skip;

describeIfDb("POST /optimize (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
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

    expect(response.body.message.error.code).toBe("INVALID_INPUT");
  });
});
```

- [ ] **Step 14: Run full backend suite**

Run: `npm run test -w backend`
Expected: all unit tests PASS; e2e suite SKIPPED unless `DATABASE_URL` is set (documented as a known gap to close when a DB is provisioned).

- [ ] **Step 15: Commit**

```bash
git add backend/src/api backend/src/main.ts backend/test
git commit -m "feat(backend): add NestJS API wiring optimize and runs endpoints"
```

---

## Task 8: Frontend scaffolding and typed API client

**Files:**
- Create: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/next.config.js`
- Create: `frontend/src/lib/api-client.ts`
- Create: `frontend/src/lib/mock-client.ts`
- Test: `frontend/src/lib/mock-contract.spec.ts`

**Interfaces:**
- Consumes: `OptimizeRequest`, `OptimizeResponse`, `RunSummary` from `@sandbox/shared`.
- Produces:
  - `interface ApiClient { optimize(req: OptimizeRequest): Promise<OptimizeResponse>; listRuns(): Promise<RunSummary[]> }`
  - `class HttpApiClient implements ApiClient`
  - `class MockApiClient implements ApiClient`

- [ ] **Step 1: Scaffold `frontend/package.json`**

```json
{
  "name": "@sandbox/frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "jest"
  },
  "dependencies": {
    "@sandbox/shared": "*",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "@types/jest": "^29.5.0"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "rootDir": "src"
  }
}
```

`frontend/tsconfig.json`:
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["dom", "es2021"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "noEmit": true
  },
  "include": ["src"]
}
```

`frontend/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
};
```

Run: `npm install`

- [ ] **Step 2: Write `frontend/src/lib/api-client.ts`**

```typescript
import { OptimizeRequest, OptimizeResponse, RunSummary } from "@sandbox/shared";

export interface ApiClient {
  optimize(req: OptimizeRequest): Promise<OptimizeResponse>;
  listRuns(): Promise<RunSummary[]>;
}

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export class HttpApiClient implements ApiClient {
  async optimize(req: OptimizeRequest): Promise<OptimizeResponse> {
    const res = await fetch(`${BASE_URL}/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body?.error?.message ?? "optimize request failed");
    }
    return res.json();
  }

  async listRuns(): Promise<RunSummary[]> {
    const res = await fetch(`${BASE_URL}/runs`);
    if (!res.ok) throw new Error("failed to list runs");
    return res.json();
  }
}
```

- [ ] **Step 3: Write `frontend/src/lib/mock-client.ts`**

```typescript
import { ApiClient } from "./api-client";
import { OptimizeRequest, OptimizeResponse, RunSummary } from "@sandbox/shared";

export class MockApiClient implements ApiClient {
  async optimize(req: OptimizeRequest): Promise<OptimizeResponse> {
    return {
      run_id: "mock-run-1",
      baseline: { average_waiting_time_sec: 41.2, throughput_vehicles: 314 },
      optimized: { average_waiting_time_sec: 29.8, throughput_vehicles: 361 },
      improvement: { waiting_time_percent: 27.7, throughput_percent: 15.0 },
      best_policy: req.scenario.intersections.map((intersection) => ({
        intersection_id: intersection.id,
        ns_green_sec: 37,
        ew_green_sec: 24,
        phase_offset_sec: 5,
      })),
    };
  }

  async listRuns(): Promise<RunSummary[]> {
    return [
      {
        run_id: "mock-run-1",
        created_at: new Date().toISOString(),
        improvement: { waiting_time_percent: 27.7, throughput_percent: 15.0 },
      },
    ];
  }
}
```

- [ ] **Step 4: Write test `frontend/src/lib/mock-contract.spec.ts`**

This is the contract-compatibility check required by `frontend/AGENTS.md` ("не придумывать новый формат response самостоятельно") — it exercises `MockApiClient` and asserts its output satisfies the exact shared `OptimizeResponse`/`RunSummary` shape (TypeScript structural typing enforces this at compile time; the test additionally checks required keys are present at runtime).

```typescript
import { MockApiClient } from "./mock-client";
import { OptimizeRequest, OptimizeResponse, RunSummary } from "@sandbox/shared";

const request: OptimizeRequest = {
  scenario: {
    seed: 1,
    duration_sec: 100,
    intersections: [
      { id: "A", ns_arrival_rate: 0.3, ew_arrival_rate: 0.3 },
      { id: "B", ns_arrival_rate: 0.3, ew_arrival_rate: 0.3 },
    ],
  },
};

function assertOptimizeResponseShape(response: OptimizeResponse) {
  expect(typeof response.run_id).toBe("string");
  expect(typeof response.baseline.average_waiting_time_sec).toBe("number");
  expect(typeof response.baseline.throughput_vehicles).toBe("number");
  expect(typeof response.optimized.average_waiting_time_sec).toBe("number");
  expect(typeof response.improvement.waiting_time_percent).toBe("number");
  expect(Array.isArray(response.best_policy)).toBe(true);
  for (const entry of response.best_policy) {
    expect(typeof entry.intersection_id).toBe("string");
    expect(typeof entry.ns_green_sec).toBe("number");
    expect(typeof entry.ew_green_sec).toBe("number");
    expect(typeof entry.phase_offset_sec).toBe("number");
  }
}

function assertRunSummaryShape(summary: RunSummary) {
  expect(typeof summary.run_id).toBe("string");
  expect(typeof summary.created_at).toBe("string");
  expect(typeof summary.improvement.waiting_time_percent).toBe("number");
}

describe("MockApiClient contract compatibility", () => {
  it("optimize() response matches OptimizeResponse shape", async () => {
    const client = new MockApiClient();
    const response = await client.optimize(request);
    assertOptimizeResponseShape(response);
  });

  it("listRuns() response matches RunSummary[] shape", async () => {
    const client = new MockApiClient();
    const runs = await client.listRuns();
    expect(runs.length).toBeGreaterThan(0);
    runs.forEach(assertRunSummaryShape);
  });

  it("best_policy has one entry per requested intersection", async () => {
    const client = new MockApiClient();
    const response = await client.optimize(request);
    expect(response.best_policy).toHaveLength(request.scenario.intersections.length);
  });
});
```

- [ ] **Step 5: Run test, verify it passes**

Run: `npm run test -w frontend -- mock-contract.spec.ts`
Expected: PASS, 3 tests green.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/tsconfig.json frontend/next.config.js frontend/src/lib
git commit -m "feat(frontend): scaffold Next.js app with typed API client and contract-matching mock"
```

---

## Task 9: Frontend UI — scenario form, comparison chart, run history

**Files:**
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/runs/page.tsx`
- Create: `frontend/src/components/ScenarioForm.tsx`
- Create: `frontend/src/components/ComparisonChart.tsx`
- Create: `frontend/src/components/RunHistoryTable.tsx`
- Test: `frontend/src/components/ScenarioForm.spec.ts` (pure logic extraction, not full RTL render — see note)

**Interfaces:**
- Consumes: `ApiClient`, `HttpApiClient`, `MockApiClient` (Task 8), `OptimizeResponse`, `RunSummary` from `@sandbox/shared`.
- Produces: `parseScenarioForm(formValues: ScenarioFormValues): OptimizeRequest` (pure, testable function extracted from the form component so form logic has unit-test coverage without a full React Testing Library setup, which is out of scope for this dry-run's test tooling).

- [ ] **Step 1: Write failing test for form parsing logic**

`frontend/src/components/ScenarioForm.spec.ts`:
```typescript
import { parseScenarioForm, ScenarioFormValues } from "./ScenarioForm";

describe("parseScenarioForm", () => {
  it("converts form values into a valid OptimizeRequest", () => {
    const values: ScenarioFormValues = {
      seed: "42",
      duration_sec: "300",
      candidates: "50",
      lambda: "1.0",
      intersections: [
        { id: "A", ns_arrival_rate: "0.4", ew_arrival_rate: "0.3" },
        { id: "B", ns_arrival_rate: "0.2", ew_arrival_rate: "0.5" },
      ],
    };
    const request = parseScenarioForm(values);
    expect(request).toEqual({
      scenario: {
        seed: 42,
        duration_sec: 300,
        intersections: [
          { id: "A", ns_arrival_rate: 0.4, ew_arrival_rate: 0.3 },
          { id: "B", ns_arrival_rate: 0.2, ew_arrival_rate: 0.5 },
        ],
      },
      options: { candidates: 50, lambda: 1.0 },
    });
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test -w frontend -- ScenarioForm.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `frontend/src/components/ScenarioForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { OptimizeRequest } from "@sandbox/shared";

export interface ScenarioFormValues {
  seed: string;
  duration_sec: string;
  candidates: string;
  lambda: string;
  intersections: { id: string; ns_arrival_rate: string; ew_arrival_rate: string }[];
}

export function parseScenarioForm(values: ScenarioFormValues): OptimizeRequest {
  return {
    scenario: {
      seed: Number(values.seed),
      duration_sec: Number(values.duration_sec),
      intersections: values.intersections.map((intersection) => ({
        id: intersection.id,
        ns_arrival_rate: Number(intersection.ns_arrival_rate),
        ew_arrival_rate: Number(intersection.ew_arrival_rate),
      })),
    },
    options: {
      candidates: Number(values.candidates),
      lambda: Number(values.lambda),
    },
  };
}

const DEFAULT_VALUES: ScenarioFormValues = {
  seed: "42",
  duration_sec: "300",
  candidates: "50",
  lambda: "1.0",
  intersections: [
    { id: "A", ns_arrival_rate: "0.4", ew_arrival_rate: "0.3" },
    { id: "B", ns_arrival_rate: "0.2", ew_arrival_rate: "0.5" },
  ],
};

export function ScenarioForm({ onSubmit }: { onSubmit: (req: OptimizeRequest) => void }) {
  const [values, setValues] = useState<ScenarioFormValues>(DEFAULT_VALUES);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(parseScenarioForm(values));
      }}
    >
      <label>
        Seed
        <input
          value={values.seed}
          onChange={(e) => setValues({ ...values, seed: e.target.value })}
        />
      </label>
      <label>
        Duration (sec)
        <input
          value={values.duration_sec}
          onChange={(e) => setValues({ ...values, duration_sec: e.target.value })}
        />
      </label>
      <label>
        Candidates
        <input
          value={values.candidates}
          onChange={(e) => setValues({ ...values, candidates: e.target.value })}
        />
      </label>
      <label>
        Lambda
        <input
          value={values.lambda}
          onChange={(e) => setValues({ ...values, lambda: e.target.value })}
        />
      </label>
      <button type="submit">Run optimization</button>
    </form>
  );
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test -w frontend -- ScenarioForm.spec.ts`
Expected: PASS, 1 test green.

- [ ] **Step 5: Write `frontend/src/components/ComparisonChart.tsx`**

```tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { OptimizeResponse } from "@sandbox/shared";

export function ComparisonChart({ response }: { response: OptimizeResponse }) {
  const data = [
    {
      metric: "Avg waiting time (sec)",
      baseline: response.baseline.average_waiting_time_sec,
      optimized: response.optimized.average_waiting_time_sec,
    },
    {
      metric: "Throughput (vehicles)",
      baseline: response.baseline.throughput_vehicles,
      optimized: response.optimized.throughput_vehicles,
    },
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="metric" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="baseline" fill="#94a3b8" name="Baseline" />
          <Bar dataKey="optimized" fill="#2563eb" name="Optimized" />
        </BarChart>
      </ResponsiveContainer>
      <p>
        Waiting time improvement: {response.improvement.waiting_time_percent.toFixed(1)}% —
        Throughput improvement: {response.improvement.throughput_percent.toFixed(1)}%
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Write `frontend/src/components/RunHistoryTable.tsx`**

```tsx
import { RunSummary } from "@sandbox/shared";

export function RunHistoryTable({ runs }: { runs: RunSummary[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Run ID</th>
          <th>Created</th>
          <th>Waiting time improvement</th>
          <th>Throughput improvement</th>
        </tr>
      </thead>
      <tbody>
        {runs.map((run) => (
          <tr key={run.run_id}>
            <td>{run.run_id}</td>
            <td>{new Date(run.created_at).toLocaleString()}</td>
            <td>{run.improvement.waiting_time_percent.toFixed(1)}%</td>
            <td>{run.improvement.throughput_percent.toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 7: Write `frontend/src/app/layout.tsx`**

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Write `frontend/src/app/page.tsx`**

Uses `MockApiClient` by default so the UI is demoable without a running backend, switching to `HttpApiClient` when `NEXT_PUBLIC_USE_MOCK=false` (documented in Task 10 README).

```tsx
"use client";

import { useState } from "react";
import { OptimizeRequest, OptimizeResponse } from "@sandbox/shared";
import { ScenarioForm } from "../components/ScenarioForm";
import { ComparisonChart } from "../components/ComparisonChart";
import { HttpApiClient } from "../lib/api-client";
import { MockApiClient } from "../lib/mock-client";

const client =
  process.env.NEXT_PUBLIC_USE_MOCK === "false" ? new HttpApiClient() : new MockApiClient();

export default function Home() {
  const [response, setResponse] = useState<OptimizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(request: OptimizeRequest) {
    setError(null);
    try {
      const result = await client.optimize(request);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "optimize failed");
    }
  }

  return (
    <main>
      <h1>Traffic Signal Sandbox — Baseline vs Optimized</h1>
      <ScenarioForm onSubmit={handleSubmit} />
      {error && <p role="alert">{error}</p>}
      {response && <ComparisonChart response={response} />}
    </main>
  );
}
```

- [ ] **Step 9: Write `frontend/src/app/runs/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { RunSummary } from "@sandbox/shared";
import { RunHistoryTable } from "../../components/RunHistoryTable";
import { HttpApiClient } from "../../lib/api-client";
import { MockApiClient } from "../../lib/mock-client";

const client =
  process.env.NEXT_PUBLIC_USE_MOCK === "false" ? new HttpApiClient() : new MockApiClient();

export default function RunsPage() {
  const [runs, setRuns] = useState<RunSummary[]>([]);

  useEffect(() => {
    client.listRuns().then(setRuns).catch(() => setRuns([]));
  }, []);

  return (
    <main>
      <h1>Run History</h1>
      <RunHistoryTable runs={runs} />
    </main>
  );
}
```

- [ ] **Step 10: Verify frontend build**

Run: `npm run build -w frontend`
Expected: builds successfully (Next.js production build).

- [ ] **Step 11: Commit**

```bash
git add frontend/src/app frontend/src/components
git commit -m "feat(frontend): add scenario form, comparison chart, and run history UI"
```

---

## Task 10: Wire up environment, docs, and full-stack smoke check

**Files:**
- Modify: `.env.example`
- Create: `backend/.env.example`
- Create: `frontend/.env.example`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/WORKLOG.md`

**Interfaces:**
- Consumes: nothing new — documentation and environment wiring only.
- Produces: documented env vars so any team member can run the stack locally.

- [ ] **Step 1: Create `backend/.env.example`**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/traffic_sandbox
PORT=3001
```

- [ ] **Step 2: Create `frontend/.env.example`**

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_USE_MOCK=true
```

- [ ] **Step 3: Update root `.env.example`**

Add below existing content:
```
# Traffic sandbox dry-run (see backend/.env.example, frontend/.env.example)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/traffic_sandbox
```

- [ ] **Step 4: Run full workspace test suite**

Run: `npm test` (from repo root)
Expected: all unit tests across `shared`, `backend`, `frontend` PASS; backend e2e suite SKIPPED (no `DATABASE_URL` in CI/local-default environment) — note this explicitly, do not claim e2e passed if it was skipped.

- [ ] **Step 5: Manual smoke check (documented, not automated)**

With a local PostgreSQL running and `DATABASE_URL` exported:
```bash
npx prisma migrate dev --schema backend/prisma/schema.prisma --name init
npm run build -w backend && node backend/dist/main.js &
NEXT_PUBLIC_USE_MOCK=false npm run dev -w frontend
```
Open `http://localhost:3000`, submit the default scenario, confirm the comparison chart renders baseline vs optimized bars and `/runs` lists the new run. Record the actual result (pass/fail, what was observed) in `docs/HANDOFF.md` — do not claim this passed without having run it.

- [ ] **Step 6: Update `docs/HANDOFF.md`**

Append a dated entry following the template in that file: task `SBX-001`, files changed (list top-level dirs touched), branch `rollan/traffic-sandbox-dryrun`, commit SHA (from `git log -1 --format=%H`), tests run and their actual results, contract changes (`docs/API_CONTRACT.md` updated for multi-intersection sandbox), blockers (e.g., e2e/manual smoke needs a running PostgreSQL — not yet verified in this environment unless Step 5 was actually run), and next step (either "ready for `docs/CASE.md`" once the real case arrives, or whatever remains).

- [ ] **Step 7: Update `docs/WORKLOG.md`**

Add an entry describing what was built (sandbox dry-run: domain/evaluator/core/api/persistence/frontend), which commands were run and their real results, and the branch/commits involved.

- [ ] **Step 8: Commit**

```bash
git add .env.example backend/.env.example frontend/.env.example docs/HANDOFF.md docs/WORKLOG.md
git commit -m "docs: document env vars and record traffic sandbox dry-run handoff"
```

- [ ] **Step 9: Push branch**

Run: `git push -u origin rollan/traffic-sandbox-dryrun`
Expected: branch pushed; per `AGENTS.md` §5, normal push is allowed without extra permission, but merge to `main` requires the team's normal review/PR process — do not merge automatically.

---

## Self-Review Notes

- **Spec coverage:** §1-2 (problem/EVOLVE formalization) → Tasks 3-5. §3 (architecture/boundaries) → file structure + Tasks 3-9. §4 (data flow) → Task 7 (API wiring). §5 (contract) → Task 2 (shared types) + Task 7 (DTOs/controller) + already-committed `docs/API_CONTRACT.md` update. §6 (errors) → Task 7 Step 8 (`INVALID_INPUT` mapping); `EVALUATOR_TIMEOUT`/`OPTIMIZATION_FAILED` are defined in the contract but not actively triggered by this dry-run's synchronous, bounded simulation — noted as a known gap, not silently dropped. §7 (testing) → unit tests in every task + e2e in Task 7 + contract-mock test in Task 8. §8 (extension points) → preserved by construction (domain/evaluator are the only case-specific modules). §9 (scope) → no auth/deploy/GA/geo added anywhere in the plan.
- **Known gap flagged, not hidden:** `EVALUATOR_TIMEOUT` and `OPTIMIZATION_FAILED` error codes exist in the DTO/contract but the current synchronous evaluator has no timeout mechanism and cannot itself throw an optimization failure (grid/random search over a pure function can't meaningfully fail). Leaving this as a documented gap rather than adding speculative timeout/error-injection code that YAGNI would reject; flag it in `docs/HANDOFF.md` (Task 10) if it matters for the real case.
- **Type consistency:** `PolicyEntry`, `ScenarioInput`, `OptimizeResponse`, `Metrics`, `Improvement`, `RunSummary` are defined once in Task 2 (`@sandbox/shared`) and imported (never redefined) in every later task — checked across Tasks 3-9.
