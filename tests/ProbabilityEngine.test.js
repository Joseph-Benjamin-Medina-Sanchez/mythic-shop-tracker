import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chroma } from '../src/models/Chroma.js';
import { WeeklyRotation } from '../src/models/WeeklyRotation.js';
import { ProbabilityEngine } from '../src/engine/ProbabilityEngine.js';

test('ProbabilityEngine: La probabilidad sube conforme se descartan chromas', () => {
  const target = new Chroma({ id: 'target_zed', name: 'Crimson Zed', champion: 'Zed' });
  const fillers = Array.from(
    { length: 99 },
    (_, i) => new Chroma({ id: `filler_${i}`, name: `Chroma ${i}`, champion: 'Champ' })
  );
  const catalog = [target, ...fillers];
  const engine = new ProbabilityEngine(catalog, 8);

  const initialMetrics = engine.calculateMetrics([], target.id);
  assert.equal(initialMetrics.nextWeekProbability, 8.0);

  const history = [];
  for (let w = 0; w < 4; w++) {
    history.push(
      new WeeklyRotation({
        date: `2026-01-0${w + 1}`,
        chromas: fillers.slice(w * 8, (w + 1) * 8),
      })
    );
  }

  const updatedMetrics = engine.calculateMetrics(history, target.id);
  assert.equal(updatedMetrics.discardedItemsCount, 32);
  assert.equal(updatedMetrics.remainingPoolSize, 68);
  assert.ok(updatedMetrics.nextWeekProbability > initialMetrics.nextWeekProbability);
});

test('ProbabilityEngine: La probabilidad es 0% si el item ya salió en el ciclo', () => {
  const target = new Chroma({ id: 'target_zed', name: 'Crimson Zed', champion: 'Zed' });
  const filler = new Chroma({ id: 'filler_1', name: 'Filler', champion: 'Champ' });
  const catalog = [target, filler];
  const engine = new ProbabilityEngine(catalog, 8);

  const history = [
    new WeeklyRotation({
      date: '2026-01-01',
      chromas: [target],
    }),
  ];

  const metrics = engine.calculateMetrics(history, target.id);
  assert.equal(metrics.nextWeekProbability, 0.0);
  assert.equal(metrics.isEligible, false);
});

test('ProbabilityEngine: calcula los días transcurridos desde la última aparición', () => {
  const target = new Chroma({ id: 'target_zed', name: 'Crimson Zed', champion: 'Zed' });
  const filler = new Chroma({ id: 'filler_1', name: 'Filler', champion: 'Champ' });
  const catalog = [target, filler];
  const engine = new ProbabilityEngine(catalog, 8);

  const history = [
    new WeeklyRotation({
      date: '2026-01-01',
      chromas: [target],
    }),
  ];

  const referenceDate = new Date('2026-01-11T00:00:00Z');
  const metrics = engine.calculateMetrics(history, target.id, referenceDate);

  assert.equal(metrics.lastSeenDate, '2026-01-01');
  assert.equal(metrics.daysSinceLastSeen, 10);
});

test('ProbabilityEngine: daysSinceLastSeen es null si nunca ha aparecido', () => {
  const target = new Chroma({ id: 'target_zed', name: 'Crimson Zed', champion: 'Zed' });
  const filler = new Chroma({ id: 'filler_1', name: 'Filler', champion: 'Champ' });
  const catalog = [target, filler];
  const engine = new ProbabilityEngine(catalog, 8);

  const metrics = engine.calculateMetrics([], target.id);

  assert.equal(metrics.lastSeenDate, null);
  assert.equal(metrics.daysSinceLastSeen, null);
});