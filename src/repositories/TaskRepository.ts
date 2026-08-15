import { BaseRepository } from "./BaseRepository";

export interface TaskEntity {
  id: string;
  projectId?: string;
  workflowId?: string;
  parentTaskId?: string;
  title: string;
  verb?: string;
  object?: string;
  role?: string;
  status: string;
  details?: string;
  createdAt: string;
  updatedAt: string;
}

export class TaskRepository extends BaseRepository<TaskEntity> {
  constructor(rootDir: string = process.cwd()) {
    super("tasks", rootDir);
  }

  mapRowToEntity(row: Record<string, any>): TaskEntity {
    return {
      id: row.id,
      projectId: row.project_id || undefined,
      workflowId: row.workflow_id || undefined,
      parentTaskId: row.parent_task_id || undefined,
      title: row.title,
      verb: row.verb || undefined,
      object: row.object || undefined,
      role: row.role || undefined,
      status: row.status,
      details: row.details || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  mapEntityToRow(entity: TaskEntity): Record<string, any> {
    return {
      id: entity.id,
      project_id: entity.projectId || null,
      workflow_id: entity.workflowId || null,
      parent_task_id: entity.parentTaskId || null,
      title: entity.title,
      verb: entity.verb || null,
      object: entity.object || null,
      role: entity.role || null,
      status: entity.status || "Open",
      details: entity.details || null,
      created_at: entity.createdAt || new Date().toISOString(),
      updated_at: entity.updatedAt || new Date().toISOString(),
    };
  }

  save(entity: TaskEntity): TaskEntity {
    const db = this.getDb();
    if (!db) return entity;
    try {
      const row = this.mapEntityToRow(entity);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO tasks (id, project_id, workflow_id, parent_task_id, title, verb, object, role, status, details, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        row.id,
        row.project_id,
        row.workflow_id,
        row.parent_task_id,
        row.title,
        row.verb,
        row.object,
        row.role,
        row.status,
        row.details,
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
