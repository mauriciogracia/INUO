export interface IRepository<T> {
  findById(id: string): Promise<T | null> | T | null;
  findAll(filter?: Partial<T>): Promise<T[]> | T[];
  save(entity: T): Promise<T> | T;
  saveBatch(entities: T[]): Promise<void> | void;
  delete(id: string): Promise<boolean> | boolean;
  findMutatedSince(timestamp: string): Promise<T[]> | T[];
  count(): Promise<number> | number;
}
