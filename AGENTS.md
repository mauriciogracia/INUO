# Agent Directives & Repository Guidelines (`AGENTS.md`)

All AI agents (Antigravity, Gemini, Seed Agents) working on the **INUO** codebase **MUST** follow the architectural rules and standards defined in [`DEV_RULES.md`](file:///d:/repos/INUO/DEV_RULES.md).

## Core Rules Reference

All project guidelines, single-definition file constraints (`src/enums/`, `src/types/`, `src/interfaces/`), DRY & SOLID design principles, model isolation, governance, and versioning rules are centrally maintained in [`DEV_RULES.md`](file:///d:/repos/INUO/DEV_RULES.md).

## Graphify Workflow

- Use an existing `graphify-out/graph.json` when it helps answer codebase or architecture questions.
- Graphify installation, configuration, extraction, or rebuilding must never block the requested implementation, debugging, or validation work.
- After completing and validating a task, refresh an existing graph with `graphify . --update` as a best-effort final step.
- If Graphify is unavailable, unconfigured, interrupted, or fails, report that briefly and leave the completed task unchanged.
- All files under `graphify-out/` are generated local artifacts and must remain ignored by Git.
