import { DatabaseSync } from 'node:sqlite';

export class DatabaseService {
  constructor(databasePath) {
    this.db = new DatabaseSync(databasePath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chromas (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        champion TEXT NOT NULL,
        cost_me INTEGER NOT NULL DEFAULT 35,
        is_mythic INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS rotations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rotation_date TEXT NOT NULL UNIQUE,
        source TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS rotation_items (
        rotation_id INTEGER NOT NULL REFERENCES rotations(id),
        chroma_id TEXT NOT NULL REFERENCES chromas(id),
        PRIMARY KEY (rotation_id, chroma_id)
      );
    `);
  }

  upsertChroma({ id, name, champion, costMe = 35, isMythic = true }) {
    this.db
      .prepare(
        `INSERT INTO chromas (id, name, champion, cost_me, is_mythic)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           champion = excluded.champion,
           cost_me = excluded.cost_me,
           is_mythic = excluded.is_mythic`
      )
      .run(id, name, champion, costMe, isMythic ? 1 : 0);
  }

  upsertCatalog(chromas) {
    for (const chroma of chromas) {
      this.upsertChroma(chroma);
    }
  }

  getCatalog() {
    return this.db
      .prepare('SELECT id, name, champion, cost_me AS costMe, is_mythic AS isMythic FROM chromas')
      .all()
      .map((row) => ({ ...row, isMythic: Boolean(row.isMythic) }));
  }

  findChroma(id) {
    const row = this.db
      .prepare('SELECT id, name, champion, cost_me AS costMe, is_mythic AS isMythic FROM chromas WHERE id = ?')
      .get(id);
    return row ? { ...row, isMythic: Boolean(row.isMythic) } : null;
  }

  hasRotationOn(date) {
    return Boolean(this.db.prepare('SELECT 1 FROM rotations WHERE rotation_date = ?').get(date));
  }

  insertRotation(date, source, chromaIds) {
    if (this.hasRotationOn(date)) {
      return null;
    }

    const { lastInsertRowid } = this.db
      .prepare('INSERT INTO rotations (rotation_date, source) VALUES (?, ?)')
      .run(date, source);

    const insertItem = this.db.prepare('INSERT INTO rotation_items (rotation_id, chroma_id) VALUES (?, ?)');
    for (const chromaId of chromaIds) {
      insertItem.run(lastInsertRowid, chromaId);
    }

    return lastInsertRowid;
  }

  getHistory() {
    const rotations = this.db
      .prepare('SELECT id, rotation_date AS date, source FROM rotations ORDER BY rotation_date ASC')
      .all();

    const itemsStatement = this.db.prepare(
      `SELECT c.id, c.name, c.champion
       FROM rotation_items ri
       JOIN chromas c ON c.id = ri.chroma_id
       WHERE ri.rotation_id = ?`
    );

    return rotations.map(({ id, date, source }) => ({
      date,
      source,
      chromas: itemsStatement.all(id),
    }));
  }

  close() {
    this.db.close();
  }
}