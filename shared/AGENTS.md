# Testing / Integration / Demo

- **Ответственный:** Асанали
- **Временная область:** `shared/` до появления реальной структуры tests/integration.

## Ownership
- tests;
- validation;
- integration;
- end-to-end;
- acceptance criteria;
- smoke checks;
- demo readiness;
- pitch evidence/materials.

## Rules
- Перед работой прочитать корневой `AGENTS.md`, `docs/CASE.md`, `docs/API_CONTRACT.md`, `docs/TASKS.md` и актуальный Handoff.
- Проверять продукт против официальных acceptance criteria.
- Проверять frontend/backend против одного API contract.
- Не менять product behavior только ради прохождения теста: mismatch сначала фиксировать.
- Рано собирать минимальный end-to-end vertical slice.
- Вести backup demo/evidence checklist.

## Done
Перед завершением:
1. выполнить доступные smoke/integration/acceptance checks;
2. точно записать, что прошло/не прошло;
3. commit + push своей ветки;
4. обновить Handoff/Issue с blockers и next step.
