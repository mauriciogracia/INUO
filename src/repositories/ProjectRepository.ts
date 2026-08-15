import { BaseRepository } from "./BaseRepository";

export interface ProjectEntity {
  id: string;
  name: string;
  jurisdiction: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class ProjectRepository extends BaseRepository<ProjectEntity> {
  constructor(rootDir: string = process.cwd()) {
    super("projects", rootDir);
  }

  mapRowToEntity(row: Record<string, any>): ProjectEntity {
    return {
      id: row.id,
      name: row.name,
      jurisdiction: row.jurisdiction,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  mapEntityToRow(entity: ProjectEntity): Record<string, any> {
    return {
      id: entity.id,
      name: entity.name,
      jurisdiction: entity.jurisdiction || "GLOBAL",
      status: entity.status || "Active",
      created_at: entity.createdAt || new Date().toISOString(),
      updated_at: entity.updatedAt || new Date().toISOString(),
    };
  }

  save(entity: ProjectEntity): ProjectEntity {
    const db = this.getDb();
    if (!db) return entity;
    try {
      const row = this.mapEntityToRow(entity);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO projects (id, name, jurisdiction, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(row.id, row.name, row.jurisdiction, row.status, row.created_at, row.updated_at);
      db.close();
      return entity;
    } catch {
      try { db.close(); } catch {}
      return entity;
    }
  }
}
