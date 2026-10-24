import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'hogwarts.db');

let db: Database | null = null;

/** Return the initialized sql.js Database instance. Throws if called before initDatabase(). */
export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/** Persist the in-memory database to disk. */
export function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

/** Initialize sql.js, load or create the database file, and start periodic saves. */
export async function initDatabase(): Promise<Database> {
  const SQL = await initSqlJs();

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Load existing database from disk if available
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  // Save to disk every 30 seconds
  const timer = setInterval(() => {
    saveDb();
  }, 30_000);
  if (timer.unref) timer.unref();

  // Save on process exit
  process.on('SIGINT', () => {
    saveDb();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    saveDb();
    process.exit(0);
  });

  return db;
}
