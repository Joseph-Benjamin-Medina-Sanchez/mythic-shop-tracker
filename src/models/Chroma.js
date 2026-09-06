export class Chroma {
  constructor({ id, name, champion, costMe = 35, isMythic = true }) {
    if (!id || typeof id !== 'string') {
      throw new TypeError('Chroma requiere un id válido en texto.');
    }
    if (!name || typeof name !== 'string') {
      throw new TypeError('Chroma requiere un nombre válido en texto.');
    }
    if (!champion || typeof champion !== 'string') {
      throw new TypeError('Chroma requiere un campeón válido en texto.');
    }

    this.id = id;
    this.name = name;
    this.champion = champion;
    this.costMe = costMe;
    this.isMythic = isMythic;

    Object.freeze(this);
  }

  toString() {
    return `${this.name} (${this.champion}) - ${this.costMe} ME`;
  }
}