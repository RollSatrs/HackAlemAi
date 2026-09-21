# AGENTS.md

## Project
HackAlem AI team repository.

This repository is the single source of truth for code.
The project documentation in `/docs` is the shared source of truth for:
- official case and requirements;
- architecture and contracts;
- team roles;
- workflow and handoffs;
- demo/pitch preparation.

## Mandatory startup procedure
Before changing code, every Codex agent MUST:

1. Pull/fetch the latest repository state.
2. Read this `AGENTS.md`.
3. Read `docs/CASE.md`.
4. Read `docs/TEAM.md`.
5. Read the assigned GitHub Issue and/or `docs/TASKS.md`.
6. Read `docs/DECISIONS.md` and the latest relevant handoff in `docs/HANDOFF.md` or the Issue/PR thread.
7. Check `docs/API_CONTRACT.md` and `docs/ARCHITECTURE.md` for current interfaces.
8. Check `docs/WORKLOG.md` for recent changes when relevant.
9. Confirm which files/modules belong to the task.
10. Do not start major implementation if the official case or acceptance criteria are unclear.

## Team roles

### Әділ Қайратов — Frontend / Visualization
Primary ownership:
- frontend;
- UI/UX;
- dashboard;
- charts and visualization;
- Baseline vs Optimized view;
- user/demo flow;
- frontend integration.

Do not change backend/core contracts silently.

### Сарсембаев Ролан — Backend / Core / Optimization
Primary ownership:
- backend/core;
- domain adapter;
- evaluator/simulation;
- controller interface;
- optimization / GA;
- metrics/scoring;
- API/data contracts;
- backend integration.

Any contract change MUST be documented before dependent work continues.

### Асанали — Testing / Integration / Demo
Primary ownership:
- tests;
- validation;
- integration;
- end-to-end flow;
- acceptance criteria;
- smoke checks;
- demo readiness;
- pitch evidence/materials.

## Branch policy
One task = one short-lived branch.

Naming:
- `adil/<task>`
- `rollan/<task>`
- `asanali/<task>`

Rules:
- never force-push `main`;
- pull/fetch before starting;
- do not overwrite another member's active work;
- keep commits small and meaningful;
- push after meaningful milestones and at required hackathon checkpoints;
- keep `main` runnable whenever possible.

## Scope protection
Do NOT:
- modify unrelated modules;
- refactor working code without task justification;
- change stable interfaces without documenting it;
- delete files or major logic without explicit approval;
- commit secrets, API keys, tokens, credentials, or real `.env` values;
- invent requirements not present in the official case;
- optimize for metrics unrelated to the official case.

## Architecture principle
Keep these concerns separated where practical:
- domain/case adapter;
- optimization/core;
- evaluator/environment;
- API/contracts;
- frontend/visualization;
- tests/integration.

Traffic optimization is a prepared sandbox, not automatically the final hackathon problem.

## Contract-first rule
Frontend and backend should not wait for each other.

Before parallel work, define:
- function/endpoint name;
- request shape;
- response shape;
- types;
- error cases;
- config/env names.

Frontend may use mocks that exactly match the agreed contract.

## Development rule
Prefer the smallest end-to-end vertical slice:

`input -> core/backend -> result -> frontend display`

Get this working early, then improve it.

Do not build all frontend first and all backend later.

## Testing rule
Before marking a task complete:
- run relevant tests;
- run a smoke check;
- verify the changed path actually works;
- verify no secrets are tracked;
- verify contract compatibility.

If tests cannot run, explicitly document why.

## Definition of Done
A task is DONE only when:

1. Code exists in the official team GitHub repository.
2. Relevant code runs.
3. Tests/smoke-check pass, or failures are documented.
4. Branch is pushed.
5. Commit SHA is known.
6. PR/link is recorded if used.
7. GitHub Issue status is updated.
8. Handoff is written.
9. Handoff contains:
   - what changed;
   - changed files/modules;
   - branch;
   - commit SHA;
   - PR/link;
   - tests/checks;
   - blockers;
   - next step;
   - API/interface changes relevant to others.

## Hackathon-specific rule
All competition implementation must follow the official HackAlem rules and use the platform-created team GitHub repository.

If an official HackAlem rule conflicts with this file, the official rule wins.

## Before final submission
- `main` is runnable;
- README setup/run steps are correct;
- no secrets are tracked;
- official requirements are satisfied;
- baseline vs optimized evidence exists where applicable;
- demo is reproducible;
- final commit is pushed;
- docs are current;
- backup screenshots/video are ready if needed.
