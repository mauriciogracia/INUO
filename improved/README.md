# Improved

This folder tracks completed improvements.

Rules:

- One completed improvement per markdown file.
- Keep file names stable and prefixed for ordering (example: `0001-short-title.md`).
- Keep status as `done` in the metadata block.
- Move completed work from `to-improve/` to `improved/` when finished.
- After moving or editing files here, run `npm run improvements:sync`.

Suggested file template:

```md
# <Title>

- id: 0001
- status: done
- completedAt: 2026-08-14
- owner: <name or team>
- source: <issue/user request/spec>

## What Changed

<summary>

## Validation

- [x] tests run
- [x] behavior verified
```
