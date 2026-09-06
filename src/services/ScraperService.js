import puppeteer from 'puppeteer';

const ROTATION_URL = 'https://rotations.lol/mythic';

const SELECTORS = {
  card: '.bg-card',
  name: 'h2',
  price: '.text-chart-5',
};

export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function guessChampion(name) {
  const beforeParen = name.includes('(') ? name.slice(0, name.indexOf('(')).trim() : name.trim();
  const words = beforeParen.split(' ');
  return words[words.length - 1];
}

export class ScraperService {
  constructor(database) {
    this.database = database;
  }

  async renderPage(browser) {
    const page = await browser.newPage();
    await page.goto(ROTATION_URL, { waitUntil: 'networkidle0', timeout: 30_000 });
    await page.waitForSelector(SELECTORS.card, { timeout: 15_000 });
    return page;
  }

  async extractItems(page) {
    return page.evaluate((selectors) => {
      const cards = Array.from(document.querySelectorAll(selectors.card));

      return cards
        .map((card) => {
          const name = card.querySelector(selectors.name)?.textContent?.trim();
          if (!name) {
            return null;
          }

          const priceText = card.querySelector(selectors.price)?.textContent?.trim() ?? '';
          const costMe = Number(priceText.replace(/\D/g, '')) || 35;

          return { name, costMe };
        })
        .filter(Boolean);
    }, SELECTORS);
  }

  async sync() {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

    try {
      const page = await this.renderPage(browser);
      const items = await this.extractItems(page);

      if (items.length === 0) {
        throw new Error('No se encontraron elementos con los selectores configurados en ScraperService.');
      }

      const chromaIds = items.map(({ name, costMe }) => {
        const champion = guessChampion(name);
        const id = slugify(name);
        this.database.upsertChroma({ id, name, champion, costMe });
        return id;
      });

      const date = new Date().toISOString().slice(0, 10);
      const insertedId = this.database.insertRotation(date, 'scraper', chromaIds);

      return {
        isNewRotation: insertedId !== null,
        date,
        count: chromaIds.length,
      };
    } finally {
      await browser.close();
    }
  }
}