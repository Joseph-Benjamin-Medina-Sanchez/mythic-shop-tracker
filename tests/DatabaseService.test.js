import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseService } from '../src/services/DatabaseService.js';

function createInMemoryDb() {
  return new DatabaseService(':memory:');
}

test('DatabaseService: guarda y recupera el catálogo', () => {
  const db = createInMemoryDb();

  db.upsertCatalog([
    { id: 'zed_a', name: 'Chroma Zed', champion: 'Zed', costMe: 35, isMythic: true },
  ]);

  const catalog = db.getCatalog();
  db.close();

  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].id, 'zed_a');
  assert.equal(catalog[0].isMythic, true);
});

test('DatabaseService: no permite dos rotaciones con la misma fecha', () => {
  const db = createInMemoryDb();

  db.upsertCatalog([{ id: 'a', name: 'A', champion: 'Zed' }]);
  const firstInsert = db.insertRotation('2026-09-01', 'manual', ['a']);
  const secondInsert = db.insertRotation('2026-09-01', 'manual', ['a']);
  db.close();

  assert.ok(firstInsert !== null);
  assert.equal(secondInsert, null);
});

test('DatabaseService: getHistory devuelve las rotaciones ordenadas con sus chromas', () => {
  const db = createInMemoryDb();

  db.upsertCatalog([
    { id: 'a', name: 'A', champion: 'Zed' },
    { id: 'b', name: 'B', champion: 'Ahri' },
  ]);
  db.insertRotation('2026-09-08', 'manual', ['b']);
  db.insertRotation('2026-09-01', 'manual', ['a']);

  const history = db.getHistory();
  db.close();

  assert.equal(history.length, 2);
  assert.equal(history[0].date, '2026-09-01');
  assert.equal(history[1].date, '2026-09-08');
  assert.equal(history[0].chromas[0].id, 'a');
});

test('DatabaseService: si un chroma_id no existe, no deja una rotación huérfana', () => {
  const db = createInMemoryDb();

  db.upsertCatalog([{ id: 'a', name: 'A', champion: 'Zed' }]);

  assert.throws(() => db.insertRotation('2026-09-01', 'manual', ['a', 'no_existe']));
  assert.equal(db.hasRotationOn('2026-09-01'), false);

  const retryInsert = db.insertRotation('2026-09-01', 'manual', ['a']);
  db.close();

  assert.ok(retryInsert !== null);
});