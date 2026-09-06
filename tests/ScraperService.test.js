import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, guessChampion } from '../src/services/ScraperService.js';

test('guessChampion: extrae el campeón de skins reales sin variante', () => {
  assert.equal(guessChampion('Prestige Triumphant General Darius'), 'Darius');
  assert.equal(guessChampion('Prestige Mecha Kingdoms Garen'), 'Garen');
  assert.equal(guessChampion('Hextech Kassadin'), 'Kassadin');
  assert.equal(guessChampion('Prestige PROJECT: Sylas'), 'Sylas');
  assert.equal(guessChampion('Ashen Conqueror Pantheon'), 'Pantheon');
});

test('guessChampion: extrae el campeón de chromas con variante entre paréntesis', () => {
  assert.equal(guessChampion('Prestige Triumphant General Darius (Vivid)'), 'Darius');
  assert.equal(guessChampion('Star Guardian Taliyah (Brilliant)'), 'Taliyah');
  assert.equal(guessChampion('La Ilusión Qiyana (Vivida)'), 'Qiyana');
  assert.equal(guessChampion('HEARTSTEEL Ezreal (Rockstar)'), 'Ezreal');
  assert.equal(guessChampion('Sugar Rush Evelynn (Sweet Tooth)'), 'Evelynn');
  assert.equal(guessChampion('Odyssey Sivir (Merc)'), 'Sivir');
});

test('slugify: genera ids estables y sin acentos', () => {
  assert.equal(slugify('La Ilusión Qiyana (Vivida)'), 'la_ilusion_qiyana_vivida');
  assert.equal(slugify('Prestige Triumphant General Darius (Vivid)'), 'prestige_triumphant_general_darius_vivid');
  assert.equal(slugify(' HEARTSTEEL Ezreal (Rockstar) '), 'heartsteel_ezreal_rockstar');
});