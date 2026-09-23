# HackAlem AI — Team Workspace

> **Официальный конкурсный repository:** [BAITC-Hacks/hack-7e4788ab-evomind](https://github.com/BAITC-Hacks/hack-7e4788ab-evomind)  
> **Этот repository:** подготовка, шаблоны и командный workflow. После старта конкурсная реализация ведётся в официальном repo. См. [docs/OFFICIAL_REPO.md](./docs/OFFICIAL_REPO.md).

Shared repository for the HackAlem AI team.

## Team
- **Әділ Қайратов** — Frontend / Visualization
- **Сарсембаев Ролан** — Backend / Core / Optimization
- **Асанали** — Testing / Integration / Demo / Presentation

## Important
Before the official case is released, this repository should contain **coordination, documentation, templates and environment preparation only**, unless the organizers explicitly confirm that pre-written competition solution code is allowed.

The official case and hackathon rules always override our internal documentation.

## Read first
1. [`AGENTS.md`](./AGENTS.md)
2. [`docs/CASE.md`](./docs/CASE.md)
3. [`docs/TEAM.md`](./docs/TEAM.md)
4. [`docs/WORKFLOW.md`](./docs/WORKFLOW.md)
5. [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md)
6. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
7. [`docs/TASKS.md`](./docs/TASKS.md) — текущая таблица задач/статусов
8. [`docs/DECISIONS.md`](./docs/DECISIONS.md) — общие решения
9. [`docs/WORKLOG.md`](./docs/WORKLOG.md) — журнал командной работы

## Shared principle
We are preparing **EVOLVE AI / Adaptive Optimization Engine** as a reusable concept.

Traffic signal optimization is only a prepared sandbox/example.  
The actual implementation must be adapted to the official case given at the hackathon.

Generic model:

`State -> Candidate Action/Policy -> Evaluation -> Metrics/Fitness -> Improvement -> Repeat`

## Source of truth
- **GitHub** — code, commits, branches, PRs, Issues, README, tests.
- **docs/** — case, architecture, API contracts, handoffs and demo notes.
- **Official HackAlem platform / Telegram** — rules, access, credentials, submission requirements.

## Git workflow
- `main` — integrated runnable version.
- `adil/<task>` — Frontend / Visualization.
- `rollan/<task>` — Backend / Core.
- `asanali/<task>` — Testing / Integration / Demo.

One task = one short-lived branch.

## Suggested first-day flow
1. Fill `docs/CASE.md` from the official case.
2. Lock MUST requirements and acceptance criteria.
3. Lock API/data contract.
4. Create GitHub Issues.
5. Work in parallel.
6. Integrate early.
7. Validate against baseline/metrics.
8. Freeze feature work before final submission.
