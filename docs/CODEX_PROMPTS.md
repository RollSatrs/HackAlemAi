# Codex Prompt Templates

## 1. Start a task
Use:

> Read `AGENTS.md`, `docs/CASE.md`, `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, and the assigned GitHub Issue. Pull/fetch latest changes first. Work only on the assigned scope. Do not change shared interfaces unless required. Before finishing, run relevant tests, commit/push the branch, and prepare a handoff with files changed, tests, branch, commit SHA, blockers and next step.

## 2. Frontend task
> You are working in Әділ's Frontend / Visualization area. Use the current API contract. If backend is not ready, use a mock that exactly matches the contract. Do not invent a different response format. Keep the UI focused on the official case and measurable result.

## 3. Backend task
> You are working in Ролан's Backend / Core / Optimization area. Preserve the agreed API/data contract. If the contract must change, update `docs/API_CONTRACT.md` first and document the change in Handoff before dependent work continues.

## 4. Testing / Integration task
> You are working in Асанали's Testing / Integration area. Read the official acceptance criteria. Validate the contract, end-to-end flow, baseline comparison, metrics and failure cases. Do not change product behavior just to make tests pass; report mismatches.

## 5. Integration check
> Pull the latest branches/merged main. Verify the smallest end-to-end path: input -> backend/core -> result -> frontend display. Report exact contract mismatches, broken commands, failing tests and blocking issues. Do not perform broad refactors.

## 6. Handoff
> Summarize this task in the Handoff format: what changed, changed files/modules, branch, commit SHA, PR, tests/checks, API/contract changes, blockers and next step. Update the GitHub Issue accordingly.
