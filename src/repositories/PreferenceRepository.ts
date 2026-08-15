import { BaseRepository } from "./BaseRepository";
import { ScopedPreference } from "../interfaces/ScopedPreference";

export class PreferenceRepository extends BaseRepository<ScopedPreference> {
  constructor(rootDir: string = process.cwd()) {
    super("preferences", rootDir);
  }

  mapRowToEntity(row: Record<string, any>): ScopedPreference {
    let val: any = row.value_json;
    try {
      val = JSON.parse(row.value_json);
    } catch {}

    return {
      key: row.pref_key,
      value: val,
      scope: row.scope,
      scopeId: row.scope_id || undefined,
      enabled: row.is_enabled === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  mapEntityToRow(entity: ScopedPreference): Record<string, any> {
    const storageKey = entity.scopeId && entity.scope !== "global"
      ? `${entity.scope}:${entity.scopeId}:${entity.key}`
      : entity.key;

    return {
      storage_key: storageKey,
      pref_key: entity.key,
      value_json: typeof entity.value === "string" ? entity.value : JSON.stringify(entity.value),
      scope: entity.scope || "global",
      scope_id: entity.scopeId || null,
      is_enabled: entity.enabled !== false ? 1 : 0,
      created_at: entity.createdAt || new Date().toISOString(),
      updated_at: entity.updatedAt || new Date().toISOString(),
    };
  }

  save(entity: ScopedPreference): ScopedPreference {
    const db = this.getDb();
    if (!db) return entity;
    try {
      const row = this.mapEntityToRow(entity);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO preferences (storage_key, pref_key, value_json, scope, scope_id, is_enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        row.storage_key,
        row.pref_key,
        row.value_json,
        row.scope,
        row.scope_id,
        row.is_enabled,
        row.created_at,
        row.updated_at
      );
      db.close();
      return entity;
    } catch {
      try { db.close(); } catch {}
      return entity;
    }
  }
}
