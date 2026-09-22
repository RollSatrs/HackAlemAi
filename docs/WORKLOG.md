# Журнал работ

## 2026-09-22 — Инициализация командного GitHub

- **Исполнитель:** команда / Codex.
- **Результат:** создан общий каркас репозитория с `backend/`, `frontend/`, `shared/`, общими AGENTS и первоначальными docs.
- **Production-код:** отсутствует.
- **Стек:** пока не зафиксирован.

## 2026-09-22 — Подготовка HackAlem workflow

- **Результат:** добавлены роли, стратегия EVOLVE AI, CASE template, архитектурные границы, API contract, preflight, Codex prompts, demo/pitch notes, GitHub Issue/PR templates и правила по предварительному коду.
- **Роли:** Әділ — Frontend/Visualization; Ролан — Backend/Core/Optimization; Асанали — Testing/Integration/Demo.
- **Что теперь готово:** общий контекст для трёх Codex и план параллельной разработки после выдачи официального кейса.
- **Что ещё не проверено:** реальный dry run всех трёх участников и доступы каждого к официальному repo/Codex.
- **Следующий шаг:** `docs/PRE_FLIGHT.md`.

## 2026-09-22 — PRE-007: единый регламент Codex

- **Исполнитель:** Codex по запросу Ролана.
- **Результат:** Корневой `AGENTS.md` пересобран как единая обязательная инструкция для всех ролей.
- **Изменённые файлы:** `AGENTS.md`, `backend/AGENTS.md`, `frontend/AGENTS.md`, `shared/AGENTS.md`, `docs/TASKS.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md`, `docs/WORKLOG.md`.
- **Что теперь работает:** Единый порядок старта, выполнения, проверки, Git-публикации и handoff.
- **Команды проверки:** `git diff --check`; `git diff --stat`; `rg` по обязательным правилам.
- **Результат тестов:** Production-код отсутствует; tests, lint, typecheck и build неприменимы.
- **Ограничения:** CI и командный dry run ещё не настроены.
- **Ветка / commit / PR:** `main`; commit будет отправлен после проверок; PR не используется для этой согласованной репозиторной правки.

## 2026-09-22 — SBX-001: Task 10 — env вайринг и full-stack smoke check

- **Исполнитель:** Ролан (Codex, backend zone).
- **Роль:** Backend / Core / Optimization.
- **ID задачи:** SBX-001, Task 10 (последняя задача плана `.superpowers/sdd/2026-09-22-traffic-sandbox-dryrun/`).
- **Результат:** Traffic sandbox dry-run (Tasks 1-9: domain/evaluator/core/api/persistence(Drizzle)/frontend) задокументирован env-переменными и прогнан через реальный full-stack smoke check.
- **Изменённые файлы:** `.env.example` (добавлена секция `DATABASE_URL`), `backend/.env.example` (новый: `DATABASE_URL`, `PORT`), `frontend/.env.example` (новый: `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_USE_MOCK`), `docs/HANDOFF.md`, `docs/WORKLOG.md`.
- **Что теперь работает:** Полный сквозной путь `input -> backend/core -> Postgres -> result -> frontend` подтверждён вручную с реальным PostgreSQL (не mock): `POST /optimize` создаёт запись в БД, `GET /runs` её возвращает, frontend dev-сервер собирается и отвечает против живого backend.
- **Команды проверки:**
  - `npm test` (корень) — backend + frontend unit-suites.
  - `psql -h localhost -U postgres -c 'select 1'` / `pg_isready -h localhost -p 5432` — проверка доступности локального Postgres (был реально запущен в этом окружении).
  - `psql -h localhost -U postgres -c "CREATE DATABASE traffic_sandbox"`.
  - `node_modules/.bin/drizzle-kit push:pg --schema=./backend/src/persistence/schema.ts --driver=pg --connectionString=postgresql://postgres@localhost:5432/traffic_sandbox` (drizzle-kit v0.20.18 — брифа-команда `npx prisma migrate dev ...` устарела после перехода Prisma→Drizzle, скорректирована согласно текущему CLI установленной версии).
  - `npm run build -w backend`.
  - `DATABASE_URL=... PORT=3001 node backend/dist/main.js` (в фоне), затем `curl -X POST http://localhost:3001/optimize ...` и `curl http://localhost:3001/runs`.
  - `NEXT_PUBLIC_USE_MOCK=false NEXT_PUBLIC_BACKEND_URL=http://localhost:3001 npm run dev -w frontend -- -p 3000` (в фоне), `curl http://localhost:3000/`.
  - Оба фоновых процесса остановлены (`kill`) после проверки.
- **Результат тестов:** backend `npm test`: `Test Suites: 1 skipped, 9 passed, 9 of 10 total`, `Tests: 2 skipped, 35 passed, 37 total` (пропущенный suite — e2e, требует `DATABASE_URL`, честно помечен SKIPPED, не PASSED). frontend `npm test`: `Test Suites: 2 passed, 2 total`, `Tests: 4 passed, 4 total`. `shared` — тестов нет. Ручной smoke: backend API + реальная Postgres-персистентность подтверждены полностью (`201`/`200`, запись видна прямым `SELECT`); frontend dev-сервер собрался и ответил `200`, но клик через UI в браузере НЕ выполнялся — нет инструмента браузерной автоматизации в этом окружении, честно отмечено как невыполненное, не выдаётся за пройденное.
- **Ограничения:** Известный пробел evaluator (`average_waiting_time_sec` недосчитывает машины в очереди на конец симуляции, `backend/src/evaluator/evaluator.ts:35-61`, задокументирован в SDD-ledger Task 4) — не устранялся, только зафиксирован в `docs/HANDOFF.md`.
- **Риски:** Визуальное поведение UI (график, история запусков) не проверено человеческим/браузерным взглядом в этой сессии — только HTTP/compile-уровень.
- **Действия других участников:** Нет.
- **Ветка / commit / PR:** `rollan/traffic-sandbox-dryrun`; commit создаётся этим же изменением после проверок; PR не создавался (пуш оставлен на усмотрение контролирующей сессии).

## Шаблон

- **Дата и время:**
- **Исполнитель:**
- **Роль:**
- **ID задачи:**
- **Результат:**
- **Изменённые файлы:**
- **Что теперь работает:**
- **Команды проверки:**
- **Результат тестов:**
- **Ограничения:**
- **Риски:**
- **Действия других участников:**
- **Ветка / commit / PR:**
