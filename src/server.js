import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseService } from './services/DatabaseService.js';
import { ScraperService } from './services/ScraperService.js';
import { ProbabilityEngine } from './engine/ProbabilityEngine.js';
import cron from 'node-cron';

const SYNC_SCHEDULE = '0 0 * * *';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

const db = new DatabaseService(path.join(__dirname, '../data/mythic.db'));
const scraperService = new ScraperService(db);

let catalog = [];
let history = [];
let engine = null;

function refreshState() {
  catalog = db.getCatalog();
  history = db.getHistory();
  engine = new ProbabilityEngine(catalog, 8);
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

app.get('/api/rotations', (req, res) => {
  res.json(history);
});

app.post('/api/rotations', (req, res) => {
  const { date, chromaIds } = req.body ?? {};

  if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'La fecha debe tener el formato YYYY-MM-DD.' });
  }

  if (!Array.isArray(chromaIds) || chromaIds.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un chroma en chromaIds.' });
  }

  const unknownIds = chromaIds.filter((id) => !db.findChroma(id));
  if (unknownIds.length > 0) {
    return res.status(400).json({ error: `IDs no encontrados en el catálogo: ${unknownIds.join(', ')}` });
  }

  const insertedId = db.insertRotation(date, 'manual', chromaIds);
  if (insertedId === null) {
    return res.status(409).json({ error: `Ya existe una rotación registrada para ${date}.` });
  }

  refreshState();
  res.status(201).json({ message: 'Rotación registrada correctamente.', date, count: chromaIds.length });
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
      chromas: rot.chromas,
    })),
  });
});

app.post('/api/sync', async (req, res) => {
  try {
    const result = await scraperService.sync();
    refreshState();

    res.json({
      message: result.isNewRotation
        ? 'Nueva rotación registrada desde rotations.lol.'
        : 'La rotación de hoy ya estaba registrada.',
      date: result.date,
      count: result.count,
    });
  } catch (error) {
    res.status(502).json({
      error: `No se pudo sincronizar con la fuente en vivo: ${error.message}. Usa el registro manual mientras tanto.`,
    });
  }
});

async function runScheduledSync() {
  try {
    const result = await scraperService.sync();
    refreshState();
    console.log(
      `[sync automático] ${result.isNewRotation ? 'nueva rotación registrada' : 'la rotación ya existía'} (${result.date}, ${result.count} items)`
    );
  } catch (error) {
    console.error(`[sync automático] falló: ${error.message}`);
  }
}

cron.schedule(SYNC_SCHEDULE, runScheduledSync);

refreshState();
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});