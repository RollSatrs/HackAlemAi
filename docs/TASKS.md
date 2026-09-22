# Задачи

Статусы: `Backlog`, `Ready`, `In Progress`, `Blocked`, `Review`, `Done`.

До выдачи официального кейса сюда заносим только инфраструктуру, доступы и подготовку процесса. Конкурсный solution-code заранее не считаем разрешённым без явного подтверждения организаторов.

## Активные задачи

| ID | Название | Ответственный | Область | Статус | Приоритет | Зависимости | Ветка / PR |
|---|---|---|---|---|---|---|---|
| PRE-001 | Проверить доступ всех 3 участников к официальному repo | Әділ | Infrastructure | Ready | Critical | — | — |
| PRE-002 | Проверить Codex + GitHub у всех 3 участников | Асанали | Infrastructure | Ready | Critical | PRE-001 | — |
| PRE-003 | Проверить `AGENTS.md` и docs всеми тремя Codex | Ролан | Infrastructure | Ready | High | PRE-001 | — |
| PRE-004 | Провести dry run: 3 ветки → commits → push → merge → handoff | Асанали | Testing / Integration | Ready | Critical | PRE-001, PRE-002 | — |
| PRE-005 | Проверить шаблон API/data contract | Ролан | Backend / Contract | Ready | High | PRE-003 | — |
| PRE-006 | Проверить Telegram/OpenAI/Codex доступы и backup demo plan | Әділ | Infrastructure | Ready | Critical | — | — |
| PRE-007 | Свести правила в единый регламент Codex | Ролан | Documentation | Done | High | — | `main` |
| CASE-001 | На старте заполнить `docs/CASE.md` по официальному кейсу | Әділ | Organization | Blocked | Critical | Официальный кейс | — |
| CASE-002 | После CASE-001 зафиксировать реальный API/data contract | Ролан | Backend / Contract | Blocked | Critical | CASE-001 | — |
| CASE-003 | После CASE-001 подготовить acceptance/integration plan | Асанали | Testing / Integration | Blocked | Critical | CASE-001 | — |
| SBX-001 | Traffic sandbox dry-run: обкатать архитектуру EVOLVE AI (не финальный кейс) | Ролан | Backend / Frontend / Contract | In Progress | High | PRE-005 | `rollan/traffic-sandbox-dryrun` |

## После выдачи кейса
Не продолжать заранее подготовленный traffic-sandbox автоматически. Сначала:

1. Заполнить `docs/CASE.md`.
2. Определить MUST, baseline, metrics, constraints и acceptance criteria.
3. Обновить `docs/API_CONTRACT.md` и `docs/ARCHITECTURE.md`.
4. Создать отдельные GitHub Issues/задачи.
5. Назначить одного владельца каждой задачи.
6. Только после этого запускать параллельную реализацию.

## Шаблон задачи

### `<ID>` — `<название>`

- **Описание:**
- **Ответственный:**
- **Рабочая область:**
- **Статус:** Backlog
- **Приоритет:**
- **Зависимости:**
- **Критерии готовности:**
- **Ветка / PR:**
- **Результат проверок:** Не запускались.
