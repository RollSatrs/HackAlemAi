# API / Data Contract

## Why this exists
Frontend and backend should work in parallel.

The contract defines how data moves between components before either side is finished.

## Contract v1 template

### Purpose
What does this endpoint/function do?

### Endpoint / Function
```text
POST /optimize
```

### Request
```json
{
  "input": {},
  "constraints": {},
  "options": {}
}
```

### Success response
```json
{
  "baseline": {},
  "optimized": {},
  "metrics": {},
  "improvement": 0,
  "run_id": "..."
}
```

### Error response
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "..."
  }
}
```

### Types
- input:
- constraints:
- baseline:
- optimized:
- metrics:
- improvement:

### Required fields
- 

### Optional fields
- 

### Error cases
- invalid input;
- missing data;
- timeout;
- evaluator unavailable;
- optimization failed.

### Environment variables
- 

### Mock response
Frontend should have a mock that exactly matches this contract.

### Owners
- Backend owner: Ролан
- Frontend consumer: Әділ
- Testing owner: Асанали

---

## Traffic sandbox example (dry-run)

Реализовано в `docs/superpowers/specs/2026-09-22-traffic-sandbox-design.md`. Сеть из 2–4 перекрёстков (не один), каждый со своей политикой фаз.

### Endpoint
```text
POST /optimize
```

### Request
```json
{
  "scenario": {
    "seed": 42,
    "duration_sec": 600,
    "intersections": [
      { "id": "A", "ns_arrival_rate": 0.4, "ew_arrival_rate": 0.3 },
      { "id": "B", "ns_arrival_rate": 0.2, "ew_arrival_rate": 0.5 }
    ]
  },
  "options": { "candidates": 50, "lambda": 1.0 }
}
```

### Success response
```json
{
  "run_id": "uuid",
  "baseline": {
    "average_waiting_time_sec": 41.2,
    "throughput_vehicles": 314
  },
  "optimized": {
    "average_waiting_time_sec": 29.8,
    "throughput_vehicles": 361
  },
  "improvement": {
    "waiting_time_percent": 27.7,
    "throughput_percent": 15.0
  },
  "best_policy": [
    { "intersection_id": "A", "ns_green_sec": 37, "ew_green_sec": 24, "phase_offset_sec": 5 }
  ]
}
```

### Error response
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "..."
  }
}
```
Коды: `INVALID_INPUT`, `EVALUATOR_TIMEOUT`, `OPTIMIZATION_FAILED`.

### Other endpoints
```text
GET /runs        -> список прошлых запусков (id, created_at, improvement summary)
GET /runs/:id     -> полная запись запуска (включая top-K кандидатов)
```

### Stack (sandbox dry-run)
- Backend: NestJS (TypeScript) + PostgreSQL (Prisma).
- Frontend: Next.js (TypeScript).
- Owners: как в разделе "Owners" выше.

## Change policy
Changing a contract after parallel work begins may create rework for 2–3 people.

Therefore:
1. document the change here;
2. mention it in Handoff/PR;
3. notify dependent owners;
4. then implement it.
