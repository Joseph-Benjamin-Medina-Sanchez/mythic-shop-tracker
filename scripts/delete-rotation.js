import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseService } from '../src/services/DatabaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const date = process.argv[2];

if (!date) {
  console.error('Uso: node scripts/delete-rotation.js YYYY-MM-DD');
  process.exit(1);
}

const db = new DatabaseService(path.join(__dirname, '../data/mythic.db'));
const deleted = db.deleteRotation(date);
db.close();

console.log(deleted ? `Rotación ${date} eliminada.` : `No existía una rotación para ${date}.`);