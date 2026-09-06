import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROTATION_URL = 'https://rotations.lol/mythic';

async function inspect() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(ROTATION_URL, { waitUntil: 'networkidle0', timeout: 30_000 });

  const html = await page.content();
  await fs.writeFile(path.join(__dirname, '../data/debug-rotations-lol.html'), html, 'utf-8');
  await page.screenshot({ path: path.join(__dirname, '../data/debug-rotations-lol.png'), fullPage: true });

  await browser.close();

  console.log('HTML renderizado guardado en data/debug-rotations-lol.html');
  console.log('Captura guardada en data/debug-rotations-lol.png');
}

inspect();