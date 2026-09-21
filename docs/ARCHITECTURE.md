# Architecture

## Prepared reusable structure
Keep the final system separated into clear concerns where practical:

### 1. Domain Adapter
Defines the official case:
- State;
- Actions;
- Constraints;
- Objective;
- Metrics;
- input/output mapping.

### 2. Optimization / Core
Case-independent where possible:
- candidate generation;
- evaluation orchestration;
- scoring;
- selection/improvement loop;
- history;
- baseline comparison.

### 3. Evaluator / Environment
Objectively checks a candidate:
- simulation;
- test set;
- API;
- scoring function;
- real feedback loop.

### 4. API / Contract
Stable communication layer between backend/core and frontend/tests.

### 5. Frontend / Visualization
Shows:
- inputs/state;
- baseline;
- optimized result;
- metrics;
- improvement;
- history/explanation.

### 6. Testing / Integration
Checks:
- acceptance criteria;
- contract compatibility;
- end-to-end path;
- deterministic/reproducible behavior where applicable.

## Stable-interface principle
Do not let one agent silently change interfaces used by another agent.

Any shared interface change must be:
1. documented in `API_CONTRACT.md`;
2. mentioned in the relevant Issue/PR;
3. included in Handoff.

## Traffic sandbox notes
Prepared concepts:
- baseline fixed-time controller;
- adaptive/evolved controller;
- deterministic seeds;
- metrics;
- validation;
- replay;
- headless evaluation;
- visualization separated from core.

Use only if the official case makes them relevant.
