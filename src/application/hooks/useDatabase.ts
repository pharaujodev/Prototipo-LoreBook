import { useEffect, useState } from 'react';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { initializeDatabase } from '../../infrastructure/database/database';

export function useDatabase() {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let settled = false;
    let database: SQLiteDatabase | undefined;
    async function prepare() {
      try {
        database = await openDatabaseAsync('lorebook.db');
        await initializeDatabase(database);
        if (!cancelled) setDb(database);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        settled = true;
        if (cancelled) void database?.closeAsync().catch(() => {});
      }
    }
    void prepare();
    return () => { cancelled = true; if (settled) void database?.closeAsync().catch(() => {}); };
  }, [attempt]);
  return { db, error, retry: () => { setError(false); setAttempt((value) => value + 1); } };
}
