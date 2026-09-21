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

## Traffic sandbox example

### Request
```json
{
  "scenario": "RUSH_HOUR",
  "seed": 42,
  "duration_sec": 600
}
```

### Response
```json
{
  "baseline": {
    "average_waiting_time": 41.2,
    "throughput": 314
  },
  "optimized": {
    "average_waiting_time": 29.8,
    "throughput": 361
  },
  "improvement": {
    "waiting_time_percent": 27.7,
    "throughput_percent": 15.0
  },
  "best_policy": {
    "ns_green": 37,
    "ew_green": 24,
    "phase_offset": 5
  }
}
```

## Change policy
Changing a contract after parallel work begins may create rework for 2–3 people.

Therefore:
1. document the change here;
2. mention it in Handoff/PR;
3. notify dependent owners;
4. then implement it.
