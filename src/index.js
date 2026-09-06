import { Chroma } from './models/Chroma.js';
import { WeeklyRotation } from './models/WeeklyRotation.js';
import { ProbabilityEngine } from './engine/ProbabilityEngine.js';

function bootstrap() {
  console.log('=== Mythic Shop Rotation & Probability Tracker ===\n');

  const targetZed = new Chroma({
    id: 'zed_galaxy_slayer_mythic',
    name: 'Proyección Carmesí (Exterminador Galáctico)',
    champion: 'Zed',
    costMe: 40,
  });

  const catalog = [targetZed];
  for (let i = 1; i < 120; i++) {
    catalog.push(
      new Chroma({
        id: `chroma_${i}`,
        name: `Evento Chroma #${i}`,
        champion: `Champion_${i}`,
        costMe: 35,
      })
    );
  }

  const history = [];
  let itemIndex = 1;
  for (let week = 1; week <= 5; week++) {
    const weeklyBatch = [];
    for (let slot = 0; slot < 8; slot++) {
      weeklyBatch.push(catalog[itemIndex++]);
    }
    history.push(
      new WeeklyRotation({
        date: `2026-08-${String(week * 7).padStart(2, '0')}`,
        chromas: weeklyBatch,
      })
    );
  }

  const engine = new ProbabilityEngine(catalog, 8);
  const report = engine.calculateMetrics(history, targetZed.id);

  console.table({
    'Cosmético': targetZed.name,
    'Campeón': targetZed.champion,
    'Total en Catálogo': report.totalCatalogSize,
    'Chromas ya rotados': report.discardedItemsCount,
    'Candidatos restantes': report.remainingPoolSize,
    'Agotamiento del pool': `${report.poolDepletionRate}%`,
    'Probabilidad próxima semana': `${report.nextWeekProbability}%`,
    'Estado': report.status,
  });
}

bootstrap();