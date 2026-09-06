import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Chroma } from './models/Chroma.js';
import { WeeklyRotation } from './models/WeeklyRotation.js';
import { ProbabilityEngine } from './engine/ProbabilityEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

const targetZed = new Chroma({
  id: 'zed_galaxy_slayer_mythic',
  name: 'Proyección Carmesí (Exterminador Galáctico)',
  champion: 'Zed',
  costMe: 35,
});

const catalog = [targetZed];
const championsPool = [
  'Sylas', 'Darius', 'Yasuo', 'Pyke', 'Kayn', 
  'Aatrox', 'Vayne', 'Riven', 'Lee Sin', 'Katarina', 
  'Akali', 'Yone', 'Pantheon', 'Mordekaiser', 'Sett'
];

for (let i = 1; i < 120; i++) {
  const champ = championsPool[i % championsPool.length];
  catalog.push(
    new Chroma({
      id: `chroma_${i}`,
      name: `Evento Chroma #${i}`,
      champion: champ,
      costMe: 35,
    })
  );
}

const dates = [
  '2026-08-07',
  '2026-08-14',
  '2026-08-21',
  '2026-08-28',
  '2026-09-04',
];

const history = [];
let itemIndex = 1;
for (let week = 0; week < 5; week++) {
  const weeklyBatch = [];
  for (let slot = 0; slot < 8; slot++) {
    weeklyBatch.push(catalog[itemIndex++]);
  }
  history.push(
    new WeeklyRotation({
      date: dates[week],
      chromas: weeklyBatch,
    })
  );
}

const engine = new ProbabilityEngine(catalog, 8);

app.get('/api/catalog', (req, res) => {
  res.json(
    catalog.map((c) => ({
      id: c.id,
      name: c.name,
      champion: c.champion,
      costMe: c.costMe,
    }))
  );
});

app.get('/api/metrics', (req, res) => {
  const targetId = req.query.targetId || targetZed.id;
  const target = catalog.find((c) => c.id === targetId);

  if (!target) {
    return res.status(404).json({ error: 'Cosmético no encontrado en el catálogo.' });
  }

  const metrics = engine.calculateMetrics(history, target.id);

  res.json({
    target: {
      id: target.id,
      name: target.name,
      champion: target.champion,
      costMe: target.costMe,
    },
    metrics,
    history: history.map((rot) => ({
      date: rot.date,
      count: rot.chromas.length,
      chromas: rot.chromas.map((c) => ({
        id: c.id,
        name: c.name,
        champion: c.champion,
      })),
    })),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});