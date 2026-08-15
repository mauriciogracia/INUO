import { BaseRepository } from "./BaseRepository";

export interface WorkspaceEntity {
  id: string;
  name: string;
  path: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class WorkspaceRepository extends BaseRepository<WorkspaceEntity> {
  constructor(rootDir: string = process.cwd()) {
    super("workspaces", rootDir);
  }

  mapRowToEntity(row: Record<string, any>): WorkspaceEntity {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  mapEntityToRow(entity: WorkspaceEntity): Record<string, any> {
    return {
      id: entity.id,
      name: entity.name,
      path: entity.path,
      status: entity.status || "Active",
      created_at: entity.createdAt || new Date().toISOString(),
      updated_at: entity.updatedAt || new Date().toISOString(),
    };
  }

  save(entity: WorkspaceEntity): WorkspaceEntity {
    const db = this.getDb();
    if (!db) return entity;
    try {
      const row = this.mapEntityToRow(entity);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO workspaces (id, name, path, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(row.id, row.name, row.path, row.status, row.created_at, row.updated_at);
      db.close();
      return entity;
    } catch {
      try { db.close(); } catch {}
      return entity;
    }
  }
}
