import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { StorageService } from './services/StorageService.js';
import { ProbabilityEngine } from './engine/ProbabilityEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

const storage = new StorageService(path.join(__dirname, '../data'));

let catalog = [];
let history = [];
let engine = null;

async function bootstrap() {
  catalog = await storage.loadCatalog();
  history = await storage.loadHistory(catalog);
  engine = new ProbabilityEngine(catalog, 8);

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

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
  if (!catalog.length || !engine) {
    return res.status(503).json({ error: 'Servicio en inicialización.' });
  }

  const targetId = req.query.targetId || catalog[0].id;
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

bootstrap();