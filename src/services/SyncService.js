import { Chroma } from '../models/Chroma.js';

export class SyncService {
  constructor(storageService) {
    this.storageService = storageService;
  }

  async fetchLiveWeeklyRotation() {
    try {
      const response = await fetch('https://rotations.lol/mythic', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      return this.parseHtmlRotation(html);
    } catch {
      return this.getFallbackBatch();
    }
  }

  parseHtmlRotation(html) {
    const extracted = [];
    const regex = /<span class="[^"]*">([^<]+)<\/span>/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      const text = match.trim();
      if (text.includes('(') && text.includes(')') && text.length > 5 && text.length < 50) {
        const parts = text.split('(');
        const skinName = parts[0].trim();
        const variant = parts.replace(')', '').trim();
        const champion = skinName.split(' ')[0];

        const id = `${champion.toLowerCase()}_${variant.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        extracted.push({
          id,
          name: `${skinName} (${variant})`,
          champion,
          costMe: 35,
          isMythic: false,
        });

        if (extracted.length === 8) break;
      }
    }

    return extracted.length >= 4 ? extracted : this.getFallbackBatch();
  }

  getFallbackBatch() {
    return [
      { id: 'evelynn_soul_fighter_limitless', name: 'Soul Fighter Evelynn (Limitless)', champion: 'Evelynn', costMe: 35, isMythic: false },
      { id: 'sivir_odyssey_merc', name: 'Odyssey Sivir (Merc)', champion: 'Sivir', costMe: 35, isMythic: false },
      { id: 'zoe_prestige_eternal_vivid', name: 'Prestige Eternal Aspect Zoe (Vivid)', champion: 'Zoe', costMe: 35, isMythic: true },
      { id: 'annie_winterblessed_wreathguard', name: 'Winterblessed Annie (Wreathguard)', champion: 'Annie', costMe: 35, isMythic: false },
      { id: 'evelynn_sugar_rush_sweet_tooth', name: 'Sugar Rush Evelynn (Sweet Tooth)', champion: 'Evelynn', costMe: 35, isMythic: false },
      { id: 'ezreal_heartsteel_rockstar', name: 'HEARTSTEEL Ezreal (Rockstar)', champion: 'Ezreal', costMe: 35, isMythic: false },
      { id: 'taliyah_star_guardian_brilliant', name: 'Star Guardian Taliyah (Brilliant)', champion: 'Taliyah', costMe: 35, isMythic: false },
      { id: 'qiyana_la_ilusion_vivida', name: 'La Ilusión Qiyana (Vivida)', champion: 'Qiyana', costMe: 35, isMythic: false },
    ];
  }

  async sync() {
    const liveItems = await this.fetchLiveWeeklyRotation();
    const currentCatalog = await this.storageService.loadCatalog();
    const catalogIds = new Set(currentCatalog.map((c) => c.id));

    let catalogUpdated = false;
    for (const item of liveItems) {
      if (!catalogIds.has(item.id)) {
        currentCatalog.push(new Chroma(item));
        catalogIds.add(item.id);
        catalogUpdated = true;
      }
    }

    if (catalogUpdated) {
      await this.storageService.saveCatalog(currentCatalog);
    }

    const today = new Date().toISOString().split('T')[0];
    const chromaIds = liveItems.map((item) => item.id);
    const isNewRotation = await this.storageService.appendRotation(today, chromaIds);

    const updatedHistory = await this.storageService.loadHistory(currentCatalog);

    return {
      success: true,
      isNewRotation,
      date: today,
      count: liveItems.length,
      catalog: currentCatalog,
      history: updatedHistory,
    };
  }
}