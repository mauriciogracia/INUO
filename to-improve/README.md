# To Improve

This folder tracks pending improvements.

Rules:

- One improvement per markdown file.
- Keep file names stable and prefixed for ordering (example: `0001-short-title.md`).
- Keep status as `pending` or `in-progress` in the metadata block.
- After adding or editing files here, run `npm run improvements:sync`.

Suggested file template:

```md
# <Title>

- id: 0001
- status: pending
- createdAt: 2026-08-14
- owner: <name or team>
- source: <issue/user request/spec>

## Context

<why this matters>

## Proposed Change

<what to implement>

## Acceptance

- [ ] condition 1
- [ ] condition 2
```
