# Team Workflow

## Source of truth
### GitHub
- code;
- commits;
- branches;
- PRs;
- Issues;
- README;
- tests;
- progress history.

### docs/
- official case;
- architecture;
- contracts;
- roles;
- handoffs;
- demo notes.

### Official HackAlem platform / Telegram
- rules;
- credentials/access;
- submission requirements;
- schedule updates.

## Branch workflow
1. Pull latest `main`.
2. Open/read assigned Issue.
3. Create short branch.
4. Codex reads `AGENTS.md` + relevant docs.
5. Implement only the assigned scope.
6. Run tests/smoke check.
7. Commit.
8. Push.
9. Open/update PR if used.
10. Write Handoff.
11. Merge frequently.
12. Everyone fetches/pulls.

## Vertical-slice rule
Do not build frontend and backend sequentially.

Target the earliest possible:

`input -> backend/core -> result -> frontend display`

Even if the first version is primitive.

## Suggested 5-hour plan
Use only if the official schedule confirms a comparable coding window.

### 00:00–00:20 — Case Lock
- read official case;
- fill `CASE.md`;
- identify MUST;
- baseline;
- metrics;
- acceptance criteria.

### 00:20–00:40 — Contract Lock
- architecture delta;
- API/data contract;
- three independent tasks;
- branches.

### 00:40–02:30 — Parallel Build
Three Codex agents work in their own areas.

### 02:30–03:30 — First Integration
- merge;
- end-to-end;
- fix contract mismatches;
- minimal working demo.

### 03:30–04:15 — Validation
- tests;
- baseline comparison;
- metrics;
- edge cases.

### 04:15–04:40 — Demo / Pitch
- stable scenario;
- screenshots;
- README;
- evidence.

### 04:40–05:00 — Freeze
No large features.
Only fixes, smoke checks and submission readiness.

## Avoid
- three agents inventing three architectures;
- two agents editing the same core module simultaneously;
- unnecessary microservices;
- infrastructure for hypothetical future scale;
- large refactors late in the session;
- important context existing only in one person's chat.
