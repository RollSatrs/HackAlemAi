# Codex — copy/paste prompts for HackAlem

Use these only after the official coding window starts and you are working inside the official repository.

## 1. Case analysis — use high reasoning

```text
You are working in the official HackAlem repository.

First, read the official case I provide below. Do not write code yet.

Extract only:
1. Problem
2. Target user/customer
3. MUST requirements
4. Constraints / forbidden actions
5. Required deliverables
6. Baseline
7. State
8. Actions
9. 1–3 primary metrics
10. Objective / fitness
11. Acceptance criteria
12. Open questions / ambiguity
13. Smallest end-to-end demo we can finish today

Then propose the minimum architecture needed for this case.

Do not invent requirements. Clearly separate:
- explicit case requirements
- assumptions
- optional ideas

Official case:
[PASTE CASE HERE]
```

## 2. Frontend — Әділ

```text
Read AGENTS.md, CASE.md and API_CONTRACT.md.

My role: Frontend / Visualization.

Task:
[PASTE ISSUE/TASK]

Work only on the frontend scope.

Requirements:
- follow the locked API contract exactly
- if backend is not ready, use a mock matching the contract
- do not change backend/core
- keep the UI focused on the official case and measurable result
- implement the smallest working demo path first

Before finishing:
- run available frontend checks
- report changed files
- report exact commands/check results
- prepare commit message
- write a short handoff with blockers and next step
```

## 3. Backend — Ролан

```text
Read AGENTS.md, CASE.md and API_CONTRACT.md.

My role: Backend / Core / Optimization.

Task:
[PASTE ISSUE/TASK]

Work only on the backend/core scope.

Requirements:
- preserve the locked API/data contract
- if a contract change is unavoidable, stop and propose the exact change before implementing it
- do not modify frontend
- prefer the smallest working end-to-end path
- do not add unnecessary infrastructure

Before finishing:
- run available backend tests/smoke checks
- report changed files
- report exact commands/check results
- prepare commit message
- write a short handoff with blockers and next step
```

## 4. Testing / Integration — Асанали

```text
Read AGENTS.md, CASE.md and API_CONTRACT.md.

My role: Testing / Integration / Demo.

Task:
[PASTE ISSUE/TASK]

Focus on:
- acceptance criteria
- frontend/backend contract compatibility
- end-to-end path
- smoke checks
- failure cases
- demo readiness

Do not change product behavior only to make a test pass.
If behavior and requirements conflict, report the mismatch.

Before finishing:
- list what passed
- list what failed
- show exact reproduction steps for blockers
- write the next integration action
```

## 5. Debugging prompt

```text
Do not analyze the whole repository.

Relevant files:
[FILES]

Error:
[PASTE ERROR / STACK TRACE]

Steps to reproduce:
[STEPS]

Expected behavior:
[EXPECTED]

Actual behavior:
[ACTUAL]

Find the most likely root cause.
Propose the smallest safe fix.
Do not refactor unrelated code.
After the fix, run the smallest relevant verification.
```

## 6. Final review prompt

```text
Perform a final submission review only.

Read:
- AGENTS.md
- CASE.md
- API_CONTRACT.md
- README.md
- current git diff/status
- available tests/build output

Check:
1. MUST requirements
2. acceptance criteria
3. runnable main path
4. API compatibility
5. tests/smoke status
6. secrets
7. broken imports/config
8. README run steps
9. demo readiness
10. obvious last-minute risks

Do not start broad refactors.
Return only:
- CRITICAL blockers
- HIGH risks
- safe small fixes
- submission readiness status
```
