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

  async saveCatalog(catalog) {
    const data = catalog.map((c) => ({
      id: c.id,
      name: c.name,
      champion: c.champion,
      costMe: c.costMe,
      isMythic: c.isMythic,
    }));
    await fs.writeFile(this.catalogPath, JSON.stringify(data, null, 2), 'utf-8');
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

    const alreadyExists = jsonList.some((item) => item.date === date);
    if (alreadyExists) {
      return false;
    }

    jsonList.push({ date, chromaIds });
    await fs.writeFile(this.historyPath, JSON.stringify(jsonList, null, 2), 'utf-8');
    return true;
  }
}