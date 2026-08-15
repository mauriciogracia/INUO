import { BaseRepository } from "./BaseRepository";
import { IntegrationConnection } from "../interfaces/IntegrationConnection";

export class IntegrationRepository extends BaseRepository<IntegrationConnection> {
  constructor(rootDir: string = process.cwd()) {
    super("integrations", rootDir);
  }

  mapRowToEntity(row: Record<string, any>): IntegrationConnection {
    let meta: any = undefined;
    if (row.metadata_json) {
      try { meta = JSON.parse(row.metadata_json); } catch {}
    }

    return {
      id: row.id,
      name: row.name,
      category: row.category,
      provider: row.provider,
      authType: row.auth_type,
      endpoint: row.endpoint || undefined,
      status: row.status,
      scope: row.scope,
      scopeId: row.scope_id || undefined,
      vaultSecretKeyRef: row.vault_secret_key_ref || undefined,
      rateLimitPerMinute: row.rate_limit_per_minute,
      metadata: meta,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  mapEntityToRow(entity: IntegrationConnection): Record<string, any> {
    return {
      id: entity.id,
      name: entity.name,
      category: entity.category,
      provider: entity.provider,
      auth_type: entity.authType || "apiKey",
      endpoint: entity.endpoint || null,
      status: entity.status || "Connected",
      scope: entity.scope || "global",
      scope_id: entity.scopeId || null,
      vault_secret_key_ref: entity.vaultSecretKeyRef || null,
      rate_limit_per_minute: entity.rateLimitPerMinute || 60,
      metadata_json: entity.metadata ? JSON.stringify(entity.metadata) : null,
      created_at: entity.createdAt || new Date().toISOString(),
      updated_at: entity.updatedAt || new Date().toISOString(),
    };
  }

  save(entity: IntegrationConnection): IntegrationConnection {
    const db = this.getDb();
    if (!db) return entity;
    try {
      const row = this.mapEntityToRow(entity);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO integrations (id, name, category, provider, auth_type, endpoint, status, scope, scope_id, vault_secret_key_ref, rate_limit_per_minute, metadata_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        row.id,
        row.name,
        row.category,
        row.provider,
        row.auth_type,
        row.endpoint,
        row.status,
        row.scope,
        row.scope_id,
        row.vault_secret_key_ref,
        row.rate_limit_per_minute,
        row.metadata_json,
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
