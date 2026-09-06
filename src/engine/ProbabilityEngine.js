export class ProbabilityEngine {
  constructor(catalog, slotsPerWeek = 8) {
    if (!Array.isArray(catalog) || catalog.length === 0) {
      throw new Error('ProbabilityEngine requiere un catálogo con elementos.');
    }
    if (typeof slotsPerWeek !== 'number' || slotsPerWeek <= 0) {
      throw new Error('slotsPerWeek debe ser un número positivo.');
    }

    this.catalog = Object.freeze([...catalog]);
    this.slotsPerWeek = slotsPerWeek;
    this.totalPoolSize = catalog.length;

    Object.freeze(this);
  }

  calculateMetrics(history, targetId) {
    if (!Array.isArray(history)) {
      throw new TypeError('El historial de rotaciones debe ser un arreglo.');
    }

    const seenIds = new Set();
    let lastSeenWeek = null;

    history.forEach((rotation, index) => {
      rotation.chromas.forEach((chroma) => {
        seenIds.add(chroma.id);
        if (chroma.id === targetId) {
          lastSeenWeek = index + 1;
        }
      });
    });

    const hasAppeared = seenIds.has(targetId);
    let remainingPool = 0;
    let nextWeekProbability = 0.0;
    let status = '';

    if (hasAppeared) {
      remainingPool = this.totalPoolSize - seenIds.size;
      nextWeekProbability = 0.0;
      status = `Apareció en la rotación #${lastSeenWeek} (En enfriamiento)`;
    } else {
      remainingPool = Math.max(this.slotsPerWeek, this.totalPoolSize - seenIds.size);
      nextWeekProbability = (this.slotsPerWeek / remainingPool) * 100;
      status = 'Elegible en el pool activo';
    }

    const poolDepletionRate = (seenIds.size / this.totalPoolSize) * 100;

    return {
      totalCatalogSize: this.totalPoolSize,
      discardedItemsCount: seenIds.size,
      remainingPoolSize: remainingPool,
      poolDepletionRate: Number(poolDepletionRate.toFixed(2)),
      nextWeekProbability: Number(nextWeekProbability.toFixed(2)),
      status,
      isEligible: !hasAppeared,
    };
  }
}