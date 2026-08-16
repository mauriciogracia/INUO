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
  const customDataDir = process.env.INUO_DATA_DIR || process.env.DATA_DIR;
  if (customDataDir) {
    const resolvedDir = path.isAbsolute(customDataDir) ? customDataDir : path.resolve(rootDir, customDataDir);
    if (!fs.existsSync(resolvedDir)) {
      try {
        fs.mkdirSync(resolvedDir, { recursive: true });
      } catch {}
    }
    return path.join(resolvedDir, ".inuo.db");
  }
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

      CREATE TABLE IF NOT EXISTS dependency_edges (
        source_uuid TEXT NOT NULL,
        target_uuid TEXT NOT NULL,
        workflow_id TEXT NOT NULL,
        dependency_type TEXT NOT NULL DEFAULT 'FS',
        transform_expression TEXT,
        condition_expression TEXT,
        PRIMARY KEY (source_uuid, target_uuid)
      );

      CREATE TABLE IF NOT EXISTS cloud_sync_journal (
        journal_id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload_diff_json TEXT,
        vector_clock_json TEXT,
        device_id TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'PENDING',
        recorded_at TEXT NOT NULL,
        synced_at TEXT
      );

      -- High-Performance Composite Indexes
      CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
      CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
      CREATE INDEX IF NOT EXISTS idx_workspaces_updated_at ON workspaces(updated_at);
      CREATE INDEX IF NOT EXISTS idx_memories_updated_at ON memories(updated_at);
      CREATE INDEX IF NOT EXISTS idx_tasks_workflow ON tasks(workflow_id, status);
      CREATE INDEX IF NOT EXISTS idx_preferences_scope ON preferences(scope, scope_id, pref_key);
      CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider, scope);
      CREATE INDEX IF NOT EXISTS idx_sync_journal_pending ON cloud_sync_journal(sync_status, recorded_at);
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
  tableName: "projects" | "workspaces" | "tasks" | "memories" | "preferences" | "integrations",
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

/**
 * Rehydrates in-memory StateData from SQLite tables (.inuo.db).
 */
export function rehydrateStateFromSqlite(rootDir: string = process.cwd()): Partial<StateData> | null {
  if (!DatabaseSync) return null;

  const dbPath = getDatabasePath(rootDir);
  if (!fs.existsSync(dbPath)) return null;

  const db = initSqliteDatabase(dbPath);
  if (!db) return null;

  try {
    const projects = db.prepare("SELECT * FROM projects").all().map((r: any) => ({
      id: r.id,
      name: r.name,
      jurisdiction: r.jurisdiction,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    const workspaces = db.prepare("SELECT * FROM workspaces").all().map((r: any) => ({
      id: r.id,
      name: r.name,
      path: r.path,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    const rawTasks = db.prepare("SELECT * FROM tasks").all();
    const needs: any[] = [];
    const workflowNodes: any[] = [];

    for (const t of rawTasks) {
      if (t.role || t.workflow_id) {
        workflowNodes.push({
          nodeName: t.title,
          workflowId: t.workflow_id || undefined,
          engineConfiguration: t.role || "TaskWorker",
        });
      } else {
        needs.push({
          id: t.id,
          verb: t.verb || "Request",
          object: t.object || t.title,
          status: t.status,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        });
      }
    }

    const rawPrefs = db.prepare("SELECT * FROM preferences").all();
    const preferences: Record<string, any> = {};
    for (const p of rawPrefs) {
      let val: any = p.value_json;
      try { val = JSON.parse(p.value_json); } catch {}
      preferences[p.storage_key] = {
        key: p.pref_key,
        value: val,
        scope: p.scope,
        scopeId: p.scope_id || undefined,
        enabled: p.is_enabled === 1,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    }

    db.close();
    return {
      projects,
      workspaces,
      needs,
      workflowNodes,
      preferences,
    };
  } catch {
    try { db.close(); } catch {}
    return null;
  }
}

/**
 * Executes VACUUM and ANALYZE for SQLite database optimization.
 */
export function vacuumSqliteDatabase(rootDir: string = process.cwd()): boolean {
  if (!DatabaseSync) return false;
  const dbPath = getDatabasePath(rootDir);
  if (!fs.existsSync(dbPath)) return false;

  const db = initSqliteDatabase(dbPath);
  if (!db) return false;

  try {
    db.exec("VACUUM; ANALYZE;");
    db.close();
    return true;
  } catch {
    try { db.close(); } catch {}
    return false;
  }
}

/**
 * Returns database telemetry stats.
 */
export function getSqliteDatabaseStats(rootDir: string = process.cwd()): {
  exists: boolean;
  sizeBytes: number;
  tables: Record<string, number>;
} {
  const dbPath = getDatabasePath(rootDir);
  if (!fs.existsSync(dbPath)) {
    return { exists: false, sizeBytes: 0, tables: {} };
  }

  const stat = fs.statSync(dbPath);
  const tables: Record<string, number> = {};

  if (DatabaseSync) {
    const db = initSqliteDatabase(dbPath);
    if (db) {
      try {
        const tableNames = ["projects", "workspaces", "tasks", "memories", "preferences", "integrations"];
        for (const tbl of tableNames) {
          const row = db.prepare(`SELECT COUNT(*) as count FROM ${tbl}`).get();
          tables[tbl] = row?.count || 0;
        }
        db.close();
      } catch {
        try { db.close(); } catch {}
      }
    }
  }

  return {
    exists: true,
    sizeBytes: stat.size,
    tables,
  };
}

