import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseService } from '../src/services/DatabaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.join(__dirname, '../data');

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function migrate() {
  const catalog = await readJson(path.join(dataDirectory, 'catalog.json'));
  const history = await readJson(path.join(dataDirectory, 'history.json'));

  const db = new DatabaseService(path.join(dataDirectory, 'mythic.db'));

  db.upsertCatalog(catalog);

  let migratedRotations = 0;
  for (const rotation of history) {
    const inserted = db.insertRotation(rotation.date, 'migration', rotation.chromaIds);
    if (inserted !== null) {
      migratedRotations += 1;
    }
  }

  db.close();

  console.log(`Catálogo migrado: ${catalog.length} chromas.`);
  console.log(`Rotaciones migradas: ${migratedRotations}/${history.length}.`);
}

migrate();