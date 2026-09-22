# Handoff

## Текущее состояние

- **Последняя выполненная задача:** PRE-007 — единый регламент для всех Codex.
- **Команда:** Әділ — Frontend / Visualization; Ролан — Backend / Core / Optimization; Асанали — Testing / Integration / Demo.
- **Production-код:** пока не добавлен.
- **Официальный кейс:** ещё не выдан; после выдачи заполняется `docs/CASE.md`.
- **Важно:** traffic optimization — только подготовленный sandbox/идея, а не обязательный финальный кейс.
- **Единое правило:** Каждый Codex сначала читает корневой `AGENTS.md`; локальный `AGENTS.md` только дополняет его.
- **Git-процесс:** короткие ветки; Codex может делать обычный commit/push после проверок; force-push и merge без отдельного разрешения запрещены.
- **Следующий шаг:** пройти `docs/PRE_FLIGHT.md` и командный dry run.

---

## Шаблон Handoff

### YYYY-MM-DD HH:MM — [Person / Area]

**Task / Issue:**  
`#<issue or TASK-ID>`

**Что сделано**
- 

**Изменённые файлы/модули**
- 

**Ветка**
`name/branch`

**Commit SHA**
`<sha>`

**PR**
`<url or none>`

**Tests / checks**
- 

**API / contract changes**
- None / describe here

**Проблемы / блокеры**
- None / describe here

**Что должен сделать следующий участник**
- 

---

### 2026-09-22 21:02 — Ролан / Backend

**Task / Issue:**
`SBX-001`

**Что сделано**
- Собран traffic sandbox dry-run сквозной путь: domain adapter (валидация сценария, baseline policy, bounds), evaluator (симуляция очередей по политике), core (кандидатный поиск/оптимизация, scoring), API (NestJS controllers `/optimize`, `/runs`), persistence (Drizzle ORM поверх Postgres — заменил Prisma в середине разработки по явному запросу пользователя, см. `.superpowers/sdd/2026-09-22-traffic-sandbox-dryrun/progress.md`, запись "Mid-flight scope change"), frontend (Next.js форма сценария, график сравнения baseline/optimized, история запусков `/runs`, typed API client с mock-режимом, точно совпадающим с `docs/API_CONTRACT.md`).
- Добавлены `backend/.env.example` (`DATABASE_URL`, `PORT`), `frontend/.env.example` (`NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_USE_MOCK`), обновлён корневой `.env.example`.
- Выполнен ручной smoke-check с реальным локальным PostgreSQL (см. "Tests / checks" и "Проблемы / блокеры").

**Изменённые файлы/модули**
- `.env.example`, `backend/.env.example`, `frontend/.env.example`, `docs/HANDOFF.md`, `docs/WORKLOG.md`

**Ветка**
`rollan/traffic-sandbox-dryrun`

**Commit SHA**
`2e8e469057768f2a1be12f8048ead3a56f4aa8d1` (HEAD перед этим коммитом; см. `git log` для точного SHA этого handoff-коммита)

**PR**
`none`

**Tests / checks**
- `npm test` (корень, все workspaces): backend — `Test Suites: 1 skipped, 9 passed, 9 of 10 total`, `Tests: 2 skipped, 35 passed, 37 total` (пропущенный suite — backend e2e, требует `DATABASE_URL`, в стандартном прогоне без него SKIPPED, НЕ считать пройденным); frontend — `Test Suites: 2 passed, 2 total`, `Tests: 4 passed, 4 total`; `shared` — тестов нет (`build`-only workspace, `--if-present` ничего не запускает).
- Ручной smoke-check (Step 5 брифа, со скорректированной Drizzle-командой вместо устаревшей Prisma-команды из плана): в этом окружении локальный PostgreSQL оказался запущен и доступен (`pg_isready` → `accepting connections`, `psql -h localhost -U postgres` работает). Выполнено реально:
  - создана БД `traffic_sandbox`;
  - `node_modules/.bin/drizzle-kit push:pg --schema=./backend/src/persistence/schema.ts --driver=pg --connectionString=postgresql://postgres@localhost:5432/traffic_sandbox` (drizzle-kit v0.20.18, установленной версии; флаг `--driver=pg` обязателен в этой версии CLI) → `[✓] Changes applied`, созданы таблицы `runs`, `candidates`;
  - `npm run build -w backend` → успешно;
  - backend запущен (`node backend/dist/main.js`, `DATABASE_URL`+`PORT=3001`) — стартовал, замаппил `/optimize` и `/runs` роуты;
  - `POST /optimize` с примером из `docs/API_CONTRACT.md` → `201`, вернул `run_id`, `baseline`/`optimized`/`improvement`/`best_policy`;
  - `GET /runs` → `200`, содержит только что созданный run; подтверждено прямым `SELECT` в Postgres — запись реально сохранена;
  - frontend (`NEXT_PUBLIC_USE_MOCK=false npm run dev -w frontend`) — стартовал, скомпилировался без ошибок (`✓ Compiled / in 2.6s`), `GET /` → `200`.
  - **Не выполнено в браузере:** клик через UI (заполнение формы, визуальное появление графика, просмотр `/runs` страницы) — в этом окружении нет инструмента браузерной автоматизации, поэтому конечное визуальное поведение UI не подтверждено вручную глазами; подтверждён только backend-контракт end-to-end через реальный Postgres и то, что frontend dev-сервер собирается и отвечает 200 против живого backend.
  - Оба процесса (backend, frontend) остановлены после проверки.

**API / contract changes**
- None — только env-документация, `docs/API_CONTRACT.md` не менялся этой задачей.

**Проблемы / блокеры**
- Известный пробел (задокументирован ранее, Task 4 SDD-ledger, не устранялся намеренно): `average_waiting_time_sec` в evaluator (`backend/src/evaluator/evaluator.ts:110-136`) недосчитывает машины, всё ещё стоящие в очереди на момент окончания симуляции — метрика смещена вниз симметрично для baseline И каждого кандидата в одном прогоне, поэтому относительное сравнение (выбор лучшей политики) остаётся корректным, но абсолютное значение среднего времени ожидания занижено. Не блокирует sandbox-демо; требует исправления перед любым production-использованием реальных цифр.
- Визуальная проверка UI (Step 5 брифа) выполнена только на уровне HTTP/компиляции, не через реальный клик в браузере — см. "Tests / checks" выше.

**Что должен сделать следующий участник**
- Готово к `docs/CASE.md`, когда будет выдан официальный кейс HackAlem — тогда traffic sandbox остаётся демонстрационным примером/sandbox, а не обязательным финальным решением (см. `AGENTS.md` §3, §6).
- При появлении реального кейса — пересмотреть evaluator `average_waiting_time_sec` gap, если точные абсолютные метрики станут critical-path.
