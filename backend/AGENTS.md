# Backend / Core / Optimization

- **Ответственный:** Сарсембаев Ролан
- **Область:** `backend/`

## Ownership
- backend/core;
- domain adapter;
- evaluator/simulation;
- controller interface;
- optimization / GA;
- metrics/scoring;
- API/data contracts;
- backend integration.

## Rules
- Перед работой прочитать корневой `AGENTS.md`, `docs/CASE.md`, `docs/API_CONTRACT.md`, `docs/TASKS.md` и актуальный Handoff.
- Сначала фиксировать API/data contract, затем реализацию.
- Не менять shared contract молча.
- Любое изменение request/response/types/errors сначала отражать в `docs/API_CONTRACT.md`.
- Изменения, влияющие на frontend/testing, обязательно указывать в Handoff.
- Не коммитить secrets.
- После появления реального backend-стека добавить точные команды lint/typecheck/tests/build.

## Done
Перед завершением:
1. запустить доступные проверки;
2. commit + push своей ветки;
3. указать branch, commit SHA, тесты и contract changes;
4. обновить Handoff/Issue.
