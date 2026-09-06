import fs from 'node:fs/promises';
import path from 'node:path';
import { Chroma } from '../models/Chroma.js';
import { WeeklyRotation } from '../models/WeeklyRotation.js';

export class StorageService {
  constructor(dataDirectory) {
    this.catalogPath = path.join(dataDirectory, 'catalog.json');
    this.historyPath = path.join(dataDirectory, 'history.json');
  }

  async loadCatalog() {
    const rawData = await fs.readFile(this.catalogPath, 'utf-8');
    const jsonList = JSON.parse(rawData);

    return jsonList.map((item) => new Chroma(item));
  }

  async loadHistory(catalog) {
    const rawData = await fs.readFile(this.historyPath, 'utf-8');
    const jsonList = JSON.parse(rawData);

    const catalogMap = new Map(catalog.map((c) => [c.id, c]));

    return jsonList.map((rotationItem) => {
      const resolvedChromas = rotationItem.chromaIds
        .map((id) => catalogMap.get(id))
        .filter(Boolean);

      return new WeeklyRotation({
        date: rotationItem.date,
        chromas: resolvedChromas,
      });
    });
  }

  async appendRotation(date, chromaIds) {
    const rawData = await fs.readFile(this.historyPath, 'utf-8');
    const jsonList = JSON.parse(rawData);

    jsonList.push({ date, chromaIds });

    await fs.writeFile(this.historyPath, JSON.stringify(jsonList, null, 2), 'utf-8');
  }
}