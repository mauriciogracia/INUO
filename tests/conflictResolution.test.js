const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const {
  resolveThreeWayEntityMerge,
  resolveFieldCollision,
  recordSyncJournalEntry,
  getPendingJournalEntries,
  drainSyncJournalQueue,
} = require("../dist/cli/conflictResolutionEngine");

test("Phase 3: Git-Like 3-Way Merge & Delta Sync Engine Unit Tests", async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(__dirname, "tmp_conflict_"));

  await t.test("Tier 1 (Fast-Forward): Linear update cleanly fast-forwards without conflict", () => {
    const base = {
      id: "task_100",
      title: "Design Database",
      status: "Open",
      updatedAt: "2026-08-15T10:00:00.000Z",
    };

    const local = { ...base }; // No local edits
    const remote = {
      ...base,
      status: "InProgress",
      updatedAt: "2026-08-15T11:00:00.000Z",
    };

    const result = resolveThreeWayEntityMerge(base, local, remote);
    assert.equal(result.tier, "FastForward");
    assert.equal(result.isResolved, true);
    assert.equal(result.mergedEntity.status, "InProgress");
    assert.equal(result.conflicts.length, 0);
  });

  await t.test("Tier 2 (Field-Level Auto-Merge): Disjoint property edits merge cleanly", () => {
    const base = {
      id: "task_200",
      title: "Implement API",
      status: "Open",
      role: "BackendDev",
      updatedAt: "2026-08-15T10:00:00.000Z",
    };

    const local = {
      ...base,
      status: "InProgress", // Local changed status
      updatedAt: "2026-08-15T11:30:00.000Z",
    };

    const remote = {
      ...base,
      role: "LeadArchitect", // Remote changed role
      updatedAt: "2026-08-15T11:45:00.000Z",
    };

    const result = resolveThreeWayEntityMerge(base, local, remote);
    assert.equal(result.tier, "FieldMerge");
    assert.equal(result.isResolved, true);
    assert.equal(result.mergedEntity.status, "InProgress");
    assert.equal(result.mergedEntity.role, "LeadArchitect");
    assert.equal(result.conflicts.length, 0);
  });

  await t.test("Tier 3 (Collision Prompt): Conflicting same-property edits surface interactive resolution", () => {
    const base = {
      id: "task_300",
      title: "Setup Cloud Store",
      status: "Open",
    };

    const local = {
      ...base,
      title: "Setup AWS S3 Store", // Local renamed title
    };

    const remote = {
      ...base,
      title: "Setup Google Drive Store", // Remote renamed title concurrently
    };

    const result = resolveThreeWayEntityMerge(base, local, remote);
    assert.equal(result.tier, "InteractivePrompt");
    assert.equal(result.isResolved, false);
    assert.equal(result.conflicts.length, 1);
    assert.equal(result.conflicts[0].field, "title");
    assert.equal(result.conflicts[0].localValue, "Setup AWS S3 Store");
    assert.equal(result.conflicts[0].remoteValue, "Setup Google Drive Store");

    // Resolve by choosing Remote version
    const resolvedResult = resolveFieldCollision(result, "title", "remote");
    assert.equal(resolvedResult.isResolved, true);
    assert.equal(resolvedResult.mergedEntity.title, "Setup Google Drive Store");
  });

  await t.test("Offline Store-and-Forward Sync Queue records and drains pending journal entries", () => {
    // 1. Record offline mutation
    const recorded = recordSyncJournalEntry(
      "TASK",
      "task_400",
      "UPDATE",
      { status: "Completed" },
      "dev_laptop",
      tmpDir
    );
    assert.equal(recorded, true);

    // 2. Query pending
    const pending = getPendingJournalEntries(tmpDir);
    assert.equal(pending.length, 1);
    assert.equal(pending[0].entity_id, "task_400");
    assert.equal(pending[0].sync_status, "PENDING");

    // 3. Drain queue on reconnection
    const drainResult = drainSyncJournalQueue(tmpDir);
    assert.equal(drainResult.drainedCount, 1);

    const remainingPending = getPendingJournalEntries(tmpDir);
    assert.equal(remainingPending.length, 0);
  });

  // Cleanup
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}
});
