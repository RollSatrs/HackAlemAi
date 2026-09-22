# Traffic Sandbox — Adaptive Signal Optimization (dry-run)

## Статус
- Тип: подготовительный sandbox/dry-run для обкатки архитектуры EVOLVE AI (`docs/ARCHITECTURE.md`, `docs/PROJECT_STRATEGY.md`).
- **Это НЕ финальное решение хакатона.** Официальный кейс ещё не выдан (`docs/CASE.md` пуст). После выдачи кейса `docs/CASE.md` заполняется, и Domain Adapter/Evaluator/контракт адаптируются под реальную задачу — Core/Optimization и общая структура API переиспользуются.
- Согласовано с решением `docs/DECISIONS.md` ("Осторожный режим по заранее написанному коду"): допустимо как dry run/изучение технологий, не как заранее подготовленный конкурсный solution-code.

## 1. Проблема и цель
Baseline: светофоры на перекрёстках работают по фиксированному расписанию (одинаковое время зелёного независимо от загрузки). Цель sandbox: показать, что адаптивный подбор политики светофора (по наблюдаемой нагрузке) даёт измеримое улучшение (меньше среднее время ожидания, выше throughput) по сравнению с baseline — и обкатать на этом полный цикл `State -> Candidate Policy -> Evaluation -> Metrics -> Selection -> Result`.

## 2. Формализация EVOLVE
- **State**: сеть из 2–4 перекрёстков, для каждого — интенсивность прибытия машин по направлениям (NS, EW), `seed`, длительность симуляции.
- **Actions / Candidate Policy**: для каждого перекрёстка — `ns_green_sec`, `ew_green_sec`, `phase_offset_sec` (в допустимых границах).
- **Constraints**: `ns_green_sec`, `ew_green_sec` ∈ [10, 60] сек; `phase_offset_sec` ∈ [0, cycle_length); сумма фаз перекрёстка не должна вызывать deadlock (простая проверка диапазонов).
- **Baseline**: фиксированная политика — равные фазы (например 30/30, offset 0) для всех перекрёстков.
- **Evaluator**: детерминированная дискретно-событийная симуляция очередей по тактам времени (1 сек/такт), с зафиксированным `seed` — на одинаковых входах всегда одинаковый результат.
- **Metrics**: `average_waiting_time_sec`, `throughput_vehicles`.
- **Objective/Fitness**: `fitness = throughput - λ * average_waiting_time` (λ — весовой коэффициент, фиксированное значение в Core, конфигурируемое через `options`).
- **Optimizer**: random/grid search — генерируется `N` кандидатов (по умолчанию 50) в границах constraints, каждый прогоняется через evaluator, выбирается кандидат с лучшим fitness.
- **Validation**: тот же `seed` даёт тот же результат (детерминизм проверяется тестом); улучшение показывается только если `fitness(best) > fitness(baseline)`, иначе честно возвращается baseline как "лучший" (без искусственного улучшения).

## 3. Архитектура и границы модулей
Монорепо:

```
backend/   NestJS + TypeScript + PostgreSQL (Drizzle ORM)
  domain/     Domain Adapter — типы State/Action/Constraint, построение сценария и baseline-политики
  evaluator/  чистая функция simulate(policy, scenario, seed) -> Metrics, без знания об HTTP/БД
  core/       optimize(scenario) -> {baseline, best, history}; генерация кандидатов, вызов evaluator, scoring, selection
  api/        REST-контроллеры (validate DTO -> domain -> core -> persist -> response)
  persistence/ Drizzle-схема (drizzle-orm + pg): runs, candidates (top-K для графика сходимости)
frontend/  Next.js + TypeScript
  — форма сценария, вызов /optimize, baseline vs optimized (recharts), история запусков (/runs)
shared/    TS-типы контракта, общие для backend/frontend (синхронно с docs/API_CONTRACT.md)
tests/     Jest unit (core, evaluator) + e2e (API против контракта)
```

Принцип: `evaluator` и `core` не знают про HTTP/БД (тестируются изолированно); `domain` не знает про оптимизацию; `api` — единственный слой, знающий про всё вместе.

## 4. Поток данных
```
UI форма (сценарий: seed, duration, intersections[], arrival rates)
  -> POST /optimize
  -> DTO validation
  -> Domain Adapter строит State + baseline policy
  -> Core: генерирует N кандидатов, для каждого + baseline вызывает Evaluator
  -> Core: scoring (fitness), выбор best
  -> Persistence: сохранить run, top-K кандидатов, best policy
  -> Response (по контракту): baseline, optimized, metrics, improvement, best_policy, run_id
  -> UI: график baseline vs optimized, % улучшения, история (/runs)
```

## 5. API-контракт (обновление docs/API_CONTRACT.md)
`POST /optimize`

Request:
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

Success response:
```json
{
  "run_id": "uuid",
  "baseline": { "average_waiting_time_sec": 41.2, "throughput_vehicles": 314 },
  "optimized": { "average_waiting_time_sec": 29.8, "throughput_vehicles": 361 },
  "improvement": { "waiting_time_percent": 27.7, "throughput_percent": 15.0 },
  "best_policy": [
    { "intersection_id": "A", "ns_green_sec": 37, "ew_green_sec": 24, "phase_offset_sec": 5 }
  ]
}
```

Error response (при ошибке валидации/таймауте):
```json
{ "error": { "code": "INVALID_INPUT", "message": "..." } }
```
Коды ошибок: `INVALID_INPUT`, `EVALUATOR_TIMEOUT`, `OPTIMIZATION_FAILED`.

`GET /runs` — список прошлых запусков (id, created_at, improvement summary).
`GET /runs/:id` — полная запись запуска (включая top-K кандидатов для графика сходимости).

Это обновление вносится в `docs/API_CONTRACT.md` до начала кодирования (contract-first, `docs/DECISIONS.md`).

## 6. Ошибки и границы
- Невалидный `scenario` (пустой список перекрёстков, arrival_rate вне [0,1], duration <= 0) → `400 INVALID_INPUT`.
- Симуляция не завершилась за разумное время (защитный таймаут) → `EVALUATOR_TIMEOUT`.
- Внутренняя ошибка оптимизации → `OPTIMIZATION_FAILED`, без утечки внутренних деталей в сообщение.
- Frontend всегда получает ответ, соответствующий контракту (используется mock в разработке, синхронный с этой схемой).

## 7. Тестирование
- Unit (evaluator): один и тот же `seed` → идентичный результат; разные `seed` → воспроизводимо разные.
- Unit (core): на сконструированном fixture с заведомо известным лучшим кандидатом core должен его найти; при N=0 candidates возвращается baseline без ошибки.
- E2E (api): `POST /optimize` с валидным сценарием возвращает ответ, соответствующий JSON-схеме контракта; невалидный вход возвращает `INVALID_INPUT`.
- Frontend/contract: mock-ответ frontend побайтово соответствует реальной схеме ответа backend (проверяется общим TS-типом из `shared/`).

## 8. Явные точки расширения под будущий официальный кейс
- `domain/` — единственное место, которое переписывается под новый State/Actions/Constraints реального кейса.
- `evaluator/` — переписывается под новый способ объективной проверки (симуляция/тест-сет/API реального кейса).
- `core/` (генерация кандидатов, scoring, selection, history) — переиспользуется почти без изменений.
- `api/`, `frontend/` — переиспользуются, меняются только под новую форму `input`/`constraints`/response данных (через `shared/` типы и `docs/API_CONTRACT.md`).

## 9. Объём (что входит / не входит)
**Входит:** backend (NestJS) с domain/evaluator/core/api, Postgres-хранение истории, Next.js-фронтенд с формой и графиками baseline vs optimized, unit+e2e тесты, обновлённый `docs/API_CONTRACT.md`.

**Не входит:** аутентификация/авторизация, деплой в прод, реальные карты/геоданные, генетический алгоритм (выбран random/grid search как более простой и предсказуемый для dry-run), поддержка десятков перекрёстков (ограничено 2–4 для наглядности демо).
