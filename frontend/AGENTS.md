# Frontend / Visualization

Этот файл дополняет корневой `AGENTS.md`. Все корневые правила обязательны.

- **Ответственный:** Әділ Қайратов
- **Область:** `frontend/`

## Ownership
- UI/UX;
- dashboard;
- visualization/charts;
- Baseline vs Optimized;
- user/demo flow;
- frontend integration.

## Rules
- Перед работой прочитать корневой `AGENTS.md`, `docs/CASE.md`, `docs/API_CONTRACT.md`, `docs/TASKS.md` и актуальный Handoff.
- Не ждать полного backend: использовать mock, который точно соответствует текущему API contract.
- Не придумывать новый формат response самостоятельно.
- Не менять backend/core contract без согласования.
- UI должен показывать требования и измеримый результат официального кейса, а не заранее придуманную предметную область.
- После выбора frontend-стека добавить точные команды lint/typecheck/tests/build.

## Done
Перед завершением:
1. проверить основной UI flow;
2. проверить mock/real API compatibility;
3. commit + push своей ветки;
4. записать branch, commit SHA, tests и blockers в Handoff/Issue.
