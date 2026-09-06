export class WeeklyRotation {
  constructor({ date, chromas = [] }) {
    if (!date || typeof date !== 'string') {
      throw new TypeError('WeeklyRotation requiere una fecha válida (YYYY-MM-DD).');
    }

    this.date = date;
    this.chromas = Object.freeze([...chromas]);

    Object.freeze(this);
  }

  contains(targetId) {
    return this.chromas.some((chroma) => chroma.id === targetId);
  }
}