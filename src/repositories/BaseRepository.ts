import { IRepository } from "../interfaces/IRepository";
import { initSqliteDatabase, getDatabasePath } from "../cli/sqliteStorageEngine";

export abstract class BaseRepository<T extends { id?: string; storage_key?: string; createdAt?: string; updatedAt?: string }>
  implements IRepository<T>
{
  protected tableName: string;
  protected rootDir: string;

  constructor(tableName: string, rootDir: string = process.cwd()) {
    this.tableName = tableName;
    this.rootDir = rootDir;
  }

  protected getDb(): any {
    const dbPath = getDatabasePath(this.rootDir);
    return initSqliteDatabase(dbPath);
  }

  abstract mapRowToEntity(row: Record<string, any>): T;
  abstract mapEntityToRow(entity: T): Record<string, any>;

  protected getIdColumn(): string {
    return this.tableName === "preferences" ? "storage_key" : "id";
  }

  findById(id: string): T | null {
    const db = this.getDb();
    if (!db) return null;
    try {
      const col = this.getIdColumn();
      const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE ${col} = ?`);
      const row = stmt.get(id);
      db.close();
      return row ? this.mapRowToEntity(row) : null;
    } catch {
      try { db.close(); } catch {}
      return null;
    }
  }

  findAll(filter?: Partial<T>): T[] {
    const db = this.getDb();
    if (!db) return [];
    try {
      const stmt = db.prepare(`SELECT * FROM ${this.tableName}`);
      const rows = stmt.all();
      db.close();
      const entities = rows.map((r: any) => this.mapRowToEntity(r));
      if (!filter) return entities;

      return entities.filter((item: any) => {
        return Object.entries(filter).every(([k, v]) => item[k] === v);
      });
    } catch {
      try { db.close(); } catch {}
      return [];
    }
  }

  abstract save(entity: T): T;

  saveBatch(entities: T[]): void {
    for (const entity of entities) {
      this.save(entity);
    }
  }

  delete(id: string): boolean {
    const db = this.getDb();
    if (!db) return false;
    try {
      const col = this.getIdColumn();
      const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE ${col} = ?`);
      stmt.run(id);
      db.close();
      return true;
    } catch {
      try { db.close(); } catch {}
      return false;
    }
  }


  findMutatedSince(timestamp: string): T[] {
    const db = this.getDb();
    if (!db) return [];
    try {
      const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE updated_at > ?`);
      const rows = stmt.all(timestamp);
      db.close();
      return rows.map((r: any) => this.mapRowToEntity(r));
    } catch {
      try { db.close(); } catch {}
      return [];
    }
  }

  count(): number {
    const db = this.getDb();
    if (!db) return 0;
    try {
      const stmt = db.prepare(`SELECT COUNT(*) as cnt FROM ${this.tableName}`);
      const res = stmt.get();
      db.close();
      return res?.cnt || 0;
    } catch {
      try { db.close(); } catch {}
      return 0;
    }
  }
}
