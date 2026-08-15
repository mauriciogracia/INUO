import { ConflictResolutionResult, FieldConflict } from "../interfaces/ConflictResolutionResult";
import { initSqliteDatabase, getDatabasePath } from "./sqliteStorageEngine";
import { getProjectPaths, loadState, saveState } from "./context";

/**
 * Performs a deterministic Git-like 3-Way Merge across Base, Local, and Remote entity versions.
 */
export function resolveThreeWayEntityMerge<T extends Record<string, any>>(
  base: T | null,
  local: T,
  remote: T
): ConflictResolutionResult<T> {
  // Tier 1: Fast-Forward (Clean Linear Progression)
  if (!base) {
    // If no common ancestor exists, check if equal
    const isIdentical = JSON.stringify(local) === JSON.stringify(remote);
    if (isIdentical) {
      return {
        tier: "FastForward",
        isResolved: true,
        mergedEntity: local,
        conflicts: [],
        summary: "✔ Fast-Forward: Local and Remote are identical.",
      };
    }
  } else {
    const localMatchesBase = JSON.stringify(local) === JSON.stringify(base);
    const remoteMatchesBase = JSON.stringify(remote) === JSON.stringify(base);

    if (localMatchesBase) {
      return {
        tier: "FastForward",
        isResolved: true,
        mergedEntity: { ...remote },
        conflicts: [],
        summary: "✔ Fast-Forward: Applied Remote version (Local had no concurrent edits).",
      };
    }

    if (remoteMatchesBase) {
      return {
        tier: "FastForward",
        isResolved: true,
        mergedEntity: { ...local },
        conflicts: [],
        summary: "✔ Fast-Forward: Preserved Local version (Remote had no concurrent edits).",
      };
    }
  }

  // Tier 2: Field-Level 3-Way Auto-Merge
  const allKeys = Array.from(new Set([...Object.keys(local), ...Object.keys(remote)]));
  const merged: Record<string, any> = { ...base };
  const conflicts: FieldConflict[] = [];

  for (const key of allKeys) {
    const baseVal = base ? base[key] : undefined;
    const localVal = local[key];
    const remoteVal = remote[key];

    const localChanged = JSON.stringify(localVal) !== JSON.stringify(baseVal);
    const remoteChanged = JSON.stringify(remoteVal) !== JSON.stringify(baseVal);
    const localRemoteEqual = JSON.stringify(localVal) === JSON.stringify(remoteVal);

    if (key === "updatedAt" || key === "updated_at" || key === "last_synced_at" || key === "lastSyncAt") {
      const localTime = localVal ? new Date(localVal).getTime() : 0;
      const remoteTime = remoteVal ? new Date(remoteVal).getTime() : 0;
      merged[key] = localTime >= remoteTime ? localVal : remoteVal;
    } else if (key === "sync_version" || key === "syncVersion") {
      merged[key] = Math.max(localVal || 1, remoteVal || 1) + 1;
    } else if (localRemoteEqual) {
      merged[key] = localVal;
    } else if (localChanged && !remoteChanged) {
      // Local edited, Remote unchanged -> Accept Local
      merged[key] = localVal;
    } else if (!localChanged && remoteChanged) {
      // Remote edited, Local unchanged -> Accept Remote
      merged[key] = remoteVal;
    } else {
      // Both sides edited the same property with different values -> Collision
      conflicts.push({
        field: key,
        localValue: localVal,
        remoteValue: remoteVal,
        baseValue: baseVal,
      });
      // Default placeholder to local value until resolved
      merged[key] = localVal;
    }
  }


  // If collisions exist -> Tier 3
  if (conflicts.length > 0) {
    return {
      tier: "InteractivePrompt",
      isResolved: false,
      mergedEntity: merged as T,
      conflicts,
      summary: `⚠ Tier 3 Collision: ${conflicts.length} conflicting field(s) require resolution.`,
    };
  }

  return {
    tier: "FieldMerge",
    isResolved: true,
    mergedEntity: merged as T,
    conflicts: [],
    summary: "✔ Field-Level Auto-Merge: Cleanly merged disjoint property edits.",
  };
}

/**
 * Resolves an active field collision with a chosen resolution strategy.
 */
export function resolveFieldCollision<T extends Record<string, any>>(
  result: ConflictResolutionResult<T>,
  fieldName: string,
  choice: "local" | "remote" | "custom",
  customValue?: any
): ConflictResolutionResult<T> {
  const conflict = result.conflicts.find((c) => c.field === fieldName);
  if (!conflict) return result;

  let resolvedVal: any;
  if (choice === "local") resolvedVal = conflict.localValue;
  else if (choice === "remote") resolvedVal = conflict.remoteValue;
  else resolvedVal = customValue;

  conflict.resolutionChoice = choice;
  conflict.resolvedValue = resolvedVal;
  result.mergedEntity[fieldName as keyof T] = resolvedVal;

  const remaining = result.conflicts.filter((c) => !c.resolutionChoice);
  if (remaining.length === 0) {
    result.isResolved = true;
    result.summary = "✔ All field collisions resolved successfully.";
  }

  return result;
}

/**
 * Records a mutation into the offline Store-and-Forward sync journal.
 */
export function recordSyncJournalEntry(
  entityType: "PROJECT" | "WORKFLOW" | "TASK" | "PREFERENCE" | "INTEGRATION",
  entityId: string,
  operation: "INSERT" | "UPDATE" | "DELETE",
  payloadDiff: Record<string, any>,
  deviceId: string = "device_local",
  rootDir: string = process.cwd()
): boolean {
  const dbPath = getDatabasePath(rootDir);
  const db = initSqliteDatabase(dbPath);
  if (!db) return false;

  try {
    const stmt = db.prepare(`
      INSERT INTO cloud_sync_journal (entity_type, entity_id, operation, payload_diff_json, device_id, sync_status, recorded_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
    `);
    stmt.run(entityType, entityId, operation, JSON.stringify(payloadDiff), deviceId, new Date().toISOString());
    db.close();
    return true;
  } catch {
    try { db.close(); } catch {}
    return false;
  }
}

/**
 * Retrieves pending journal entries from SQLite.
 */
export function getPendingJournalEntries(rootDir: string = process.cwd()): any[] {
  const dbPath = getDatabasePath(rootDir);
  const db = initSqliteDatabase(dbPath);
  if (!db) return [];

  try {
    const stmt = db.prepare("SELECT * FROM cloud_sync_journal WHERE sync_status = 'PENDING' ORDER BY recorded_at ASC");
    const rows = stmt.all();
    db.close();
    return rows;
  } catch {
    try { db.close(); } catch {}
    return [];
  }
}

/**
 * Drains and marks pending journal entries as COMMITTED after successful cloud sync.
 */
export function drainSyncJournalQueue(rootDir: string = process.cwd()): { drainedCount: number } {
  const dbPath = getDatabasePath(rootDir);
  const db = initSqliteDatabase(dbPath);
  if (!db) return { drainedCount: 0 };

  try {
    const pending = db.prepare("SELECT journal_id FROM cloud_sync_journal WHERE sync_status = 'PENDING'").all();
    if (pending.length > 0) {
      const now = new Date().toISOString();
      db.prepare("UPDATE cloud_sync_journal SET sync_status = 'COMMITTED', synced_at = ? WHERE sync_status = 'PENDING'").run(now);
    }
    db.close();
    return { drainedCount: pending.length };
  } catch {
    try { db.close(); } catch {}
    return { drainedCount: 0 };
  }
}
