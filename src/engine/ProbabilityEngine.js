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

  calculateMetrics(history, targetId, referenceDate = new Date()) {
    if (!Array.isArray(history)) {
      throw new TypeError('El historial de rotaciones debe ser un arreglo.');
    }

    const seenIds = new Set();
    let lastSeenDate = null;

    for (const rotation of history) {
      for (const chroma of rotation.chromas) {
        seenIds.add(chroma.id);
        if (chroma.id === targetId) {
          lastSeenDate = rotation.date;
        }
      }
    }

    const hasAppeared = seenIds.has(targetId);
    const remainingPool = hasAppeared
      ? this.totalPoolSize - seenIds.size
      : Math.max(this.slotsPerWeek, this.totalPoolSize - seenIds.size);
    const nextWeekProbability = hasAppeared ? 0 : (this.slotsPerWeek / remainingPool) * 100;
    const poolDepletionRate = (seenIds.size / this.totalPoolSize) * 100;
    const daysSinceLastSeen = lastSeenDate
      ? Math.floor((referenceDate.getTime() - new Date(lastSeenDate).getTime()) / 86_400_000)
      : null;
    const status = hasAppeared
      ? `Apareció el ${lastSeenDate} (En enfriamiento)`
      : 'Elegible en el pool activo';

    return {
      totalCatalogSize: this.totalPoolSize,
      discardedItemsCount: seenIds.size,
      remainingPoolSize: remainingPool,
      poolDepletionRate: Number(poolDepletionRate.toFixed(2)),
      nextWeekProbability: Number(nextWeekProbability.toFixed(2)),
      status,
      isEligible: !hasAppeared,
      lastSeenDate,
      daysSinceLastSeen,
    };
  }
}