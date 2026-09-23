# HackAlem — 13:00 Start Runbook

Use this page as the live checklist when the official coding window starts.

## A. 12:30–12:50 — activate resources

### ChatGPT / Codex Pro 5x
Activate on the ChatGPT account actually used in VS Code Codex.

Checklist:
- [ ] Pro 5x activated
- [ ] VS Code Codex is logged into the same account
- [ ] Codex Usage page/status checked
- [ ] Remaining limit visible

### OpenAI API $50
This is separate from Codex limits.

Checklist:
- [ ] API credit activated
- [ ] OpenAI Platform project created for HackAlem
- [ ] API key created only if the official case needs OpenAI API
- [ ] Key stored only in local `.env`
- [ ] Never paste API key into GitHub, README, Issues, PRs, screenshots, chat, or docs

### NVIDIA $50
Activate only if useful for the official case.

Checklist:
- [ ] NVIDIA credit activated if needed
- [ ] API key stored only in local `.env`

---

## B. 12:50–13:00 — repo preflight

Official repository:

```text
https://github.com/BAITC-Hacks/hack-7e4788ab-evomind.git
```

Preparation/reference repository:

```text
https://github.com/RollSatrs/HackAlemAi.git
```

### Clone official repo

```bash
git clone https://github.com/BAITC-Hacks/hack-7e4788ab-evomind.git
cd hack-7e4788ab-evomind
git status
git remote -v
```

Do NOT copy competition solution code from the preparation repo.

---

## C. 13:00–13:20 — CASE LOCK

As soon as the official case appears:

1. Copy the official case text exactly.
2. Fill:
   - Problem
   - User / customer
   - MUST requirements
   - Constraints
   - Deliverables
   - Baseline
   - State
   - Actions
   - Metrics
   - Objective / Fitness
   - Acceptance criteria
3. Decide what the smallest working demo is.
4. Do not start broad implementation before this is clear.

Output to create in official repo:
- `CASE.md`
- one short list of MUST requirements
- one short list of acceptance criteria

---

## D. 13:20–13:40 — CONTRACT LOCK

Create the minimum shared contract before parallel coding.

Lock:
- endpoint/function names
- request schema
- response schema
- types
- error cases
- env/config names

Frontend may start on mocks immediately after contract lock.

---

## E. Team split

### Әділ — Frontend / Visualization
Branch prefix:
```text
adil/
```

Owns:
- UI/UX
- dashboard
- visualization
- user/demo flow
- frontend integration

### Ролан — Backend / Core / Optimization
Branch prefix:
```text
rollan/
```

Owns:
- backend/core
- API contract implementation
- domain adapter
- evaluator/simulation
- optimizer
- metrics/scoring

### Асанали — Testing / Integration / Demo
Branch prefix:
```text
asanali/
```

Owns:
- tests
- integration
- acceptance criteria
- smoke checks
- demo readiness
- pitch evidence

---

## F. First branch commands

Әділ:
```bash
git checkout -b adil/frontend-shell
```

Ролан:
```bash
git checkout -b rollan/backend-core
```

Асанали:
```bash
git checkout -b asanali/integration-tests
```

Use real task names after the case is known.

---

## G. 13:40–15:30 — parallel build

Target the smallest end-to-end vertical slice:

```text
input -> backend/core -> result -> frontend display
```

Rules:
- one task = one owner
- one task = one short branch
- no silent contract changes
- no broad refactors
- no duplicate parallel implementation
- use only relevant files/context
- run checks before push

---

## H. Checkpoints

### H+1
- [ ] official case understood
- [ ] first meaningful commit pushed
- [ ] contract locked

### H+2
- [ ] first end-to-end vertical slice works

### H+3
- [ ] core functionality works
- [ ] integration started

### H+4
- [ ] validation/tests
- [ ] baseline vs optimized evidence

### Final 20 minutes
- [ ] freeze new features
- [ ] final smoke test
- [ ] final push
- [ ] README/run instructions
- [ ] demo path
- [ ] backup screenshots/video if allowed
- [ ] no secrets

---

## I. Model usage

Use model effort intentionally:

- **Astra / highest reasoning** — case analysis, architecture, uncertainty, coordination.
- **Sol / high** — hard implementation, difficult debugging, cross-module changes.
- **Terra / Medium** — default coding, features, fixes.
- **Luna / Low** — narrow/simple changes with clear checks.

Goal: minimize cost per successful verified result, not tokens per single request.

---

## J. Emergency rule

If the team is stuck:
1. stop broad coding;
2. identify the exact blocker;
3. write one narrow reproducible prompt;
4. include only relevant files/logs/stack trace;
5. use higher reasoning only for the blocker;
6. verify the fix;
7. continue.

Do not let all three Codex agents attack the same blocker independently unless explicitly coordinated.
