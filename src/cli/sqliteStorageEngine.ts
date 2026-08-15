import fs from "fs";
import path from "path";
import { StateData } from "./context";

// Dynamic SQLite loader with graceful fallback
let DatabaseSync: any = null;
try {
  const sqlite = require("node:sqlite");
  DatabaseSync = sqlite.DatabaseSync;
} catch {
  // Graceful fallback if SQLite module is unavailable
}

export function getDatabasePath(rootDir: string = process.cwd()): string {
  return path.join(rootDir, ".inuo.db");
}

/**
 * Initializes SQLite schema in WAL mode.
 */
export function initSqliteDatabase(dbPath: string): any {
  if (!DatabaseSync) return null;

  try {
    const db = new DatabaseSync(dbPath);
    db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;

      CREATE TABLE IF NOT EXISTS collection_sync_meta (
        collection_name TEXT PRIMARY KEY,
        last_sync_at TEXT NOT NULL,
        sync_vector_version INTEGER NOT NULL DEFAULT 1,
        record_count INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        jurisdiction TEXT NOT NULL DEFAULT 'GLOBAL',
        status TEXT NOT NULL DEFAULT 'Active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        workflow_id TEXT,
        parent_task_id TEXT,
        title TEXT NOT NULL,
        entity_type TEXT NOT NULL DEFAULT 'task',
        verb TEXT,
        object TEXT,
        complement_verb TEXT,
        role TEXT,
        status TEXT NOT NULL DEFAULT 'Open',
        details TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        memory_type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        topic TEXT,
        status TEXT NOT NULL DEFAULT 'Active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS preferences (
        storage_key TEXT PRIMARY KEY,
        pref_key TEXT NOT NULL,
        value_json TEXT NOT NULL,
        scope TEXT NOT NULL DEFAULT 'global',
        scope_id TEXT,
        is_enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS integrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        provider TEXT NOT NULL,
        auth_type TEXT NOT NULL DEFAULT 'apiKey',
        endpoint TEXT,
        status TEXT NOT NULL DEFAULT 'Connected',
        scope TEXT NOT NULL DEFAULT 'global',
        scope_id TEXT,
        vault_secret_key_ref TEXT,
        rate_limit_per_minute INTEGER DEFAULT 60,
        metadata_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    return db;

  } catch (err) {
    return null;
  }
}

/**
 * Persists state into SQLite tables (Write-Through L1 RAM -> L2 SQLite).
 */
export function persistStateToSqlite(data: StateData, rootDir: string = process.cwd()): boolean {
  if (!DatabaseSync) return false;

  const dbPath = getDatabasePath(rootDir);
  const db = initSqliteDatabase(dbPath);
  if (!db) return false;

  try {
    const now = new Date().toISOString();

    // 1. Projects
    if (data.projects && data.projects.length > 0) {
      const insertProj = db.prepare(`
        INSERT OR REPLACE INTO projects (id, name, jurisdiction, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const p of data.projects) {
        insertProj.run(p.id, p.name, p.jurisdiction || "GLOBAL", p.status || "Active", p.createdAt || now, p.updatedAt || now);
      }
    }

    // 2. Workspaces
    if (data.workspaces && data.workspaces.length > 0) {
      const insertWs = db.prepare(`
        INSERT OR REPLACE INTO workspaces (id, name, path, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const ws of data.workspaces) {
        insertWs.run(ws.id, ws.name, ws.path, ws.status || "Active", ws.createdAt || now, ws.updatedAt || now);
      }
    }

    // 3. Tasks & Workflow Nodes & Needs & Offers
    const insertTask = db.prepare(`
      INSERT OR REPLACE INTO tasks (id, project_id, workflow_id, parent_task_id, title, entity_type, verb, object, complement_verb, role, status, details, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    if (data.needs) {
      for (const n of data.needs) {
        insertTask.run(n.id, null, null, n.parentNeedId || null, `NEED: ${n.verb} ${n.object}`, "need", n.verb, n.object, n.complementVerb || null, null, n.status || "Open", n.details || null, n.createdAt || now, n.updatedAt || now);
      }
    }

    if (data.workflowNodes) {
      for (const wn of data.workflowNodes) {
        insertTask.run(wn.nodeId, null, null, null, wn.nodeName, "workflowNode", null, null, null, null, "Open", wn.engineConfiguration || null, wn.createdAt || now, wn.updatedAt || now);
      }
    }

    // 4. Preferences (Scoped & Global)
    if (data.preferences) {
      const insertPref = db.prepare(`
        INSERT OR REPLACE INTO preferences (storage_key, pref_key, value_json, scope, scope_id, is_enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const [sk, item] of Object.entries(data.preferences as Record<string, any>)) {
        const pk = item.key || sk;
        const valJson = JSON.stringify(item.value !== undefined ? item.value : item);
        const sc = item.scope || "global";
        const scId = item.scopeId || null;
        const enabled = item.enabled !== false ? 1 : 0;
        insertPref.run(sk, pk, valJson, sc, scId, enabled, item.createdAt || now, item.updatedAt || now);
      }
    }

    // Update collection sync metadata
    const updateSyncMeta = db.prepare(`
      INSERT OR REPLACE INTO collection_sync_meta (collection_name, last_sync_at, sync_vector_version, record_count)
      VALUES (?, ?, ?, ?)
    `);
    updateSyncMeta.run("projects", now, 1, data.projects?.length || 0);
    updateSyncMeta.run("workspaces", now, 1, data.workspaces?.length || 0);
    updateSyncMeta.run("tasks", now, 1, (data.needs?.length || 0) + (data.workflowNodes?.length || 0));
    updateSyncMeta.run("preferences", now, 1, Object.keys(data.preferences || {}).length);

    db.close();
    return true;
  } catch (err) {
    try { db.close(); } catch {}
    return false;
  }
}

/**
 * Loads mutated entities from SQLite since a given timestamp.
 */
export function queryMutatedEntitiesSince(
  tableName: "projects" | "workspaces" | "tasks" | "memories" | "preferences",
  lastSyncAt: string,
  rootDir: string = process.cwd(),
): any[] {
  if (!DatabaseSync) return [];

  const dbPath = getDatabasePath(rootDir);
  if (!fs.existsSync(dbPath)) return [];

  const db = initSqliteDatabase(dbPath);
  if (!db) return [];

  try {
    const stmt = db.prepare(`SELECT * FROM ${tableName} WHERE updated_at > ?`);
    const rows = stmt.all(lastSyncAt);
    db.close();
    return rows;
  } catch {
    try { db.close(); } catch {}
    return [];
  }
}
