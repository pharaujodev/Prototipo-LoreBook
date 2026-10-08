import type { SQLiteDatabase } from 'expo-sqlite';

// expo-sqlite usa a conexão compartilhada também na Web. Serializar comandos evita
// transações sobrepostas (cadastro, status e escrita) sem depender de API só nativa.
const pending = new WeakMap<SQLiteDatabase, Promise<unknown>>();
export function inTransaction<T>(db: SQLiteDatabase, action: () => Promise<T>): Promise<T> {
  const task = (pending.get(db) ?? Promise.resolve()).catch(() => undefined).then(async () => {
    let value!: T;
    await db.withTransactionAsync(async () => { value = await action(); });
    return value;
  });
  pending.set(db, task);
  return task;
}
