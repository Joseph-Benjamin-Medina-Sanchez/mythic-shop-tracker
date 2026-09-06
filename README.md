# 🌌 Mythic Shop Tracker — A League of Legends Project

[![Node.js CI](https://github.com/Joseph-Benjamin-Medina-Sanchez/mythic-shop-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Joseph-Benjamin-Medina-Sanchez/mythic-shop-tracker/actions/workflows/ci.yml)
![Node.js Version](https://img.shields.io/badge/Node.js-22.5%2B-green)
![Express](https://img.shields.io/badge/Express-4.x-orange)
![SQLite](https://img.shields.io/badge/Storage-SQLite-003B57)
![Puppeteer](https://img.shields.io/badge/Scraper-Puppeteer-40B5A4)
![License](https://img.shields.io/badge/License-MIT-blue)

A full-stack JavaScript application that tracks League of Legends' **Mythic Shop** rotation in real time, stores every rotation it has ever seen, and calculates the statistical odds of a specific chroma appearing again soon.

##  The Problem

The Mythic Shop rotates a set of exclusive mythic skins, prestige skins, and chromas with no advance notice in the patch notes. If you're saving up Mythic Essence for one specific chroma, there's no official way to know how likely it is to show up next — or how long it's been since it last did.

This project solves that with two things working together:

1. **A real scraper** that reads the live rotation from a third-party tracking site (`rotations.lol`) and a **manual entry form** as a reliable fallback when scraping isn't possible.
2. **A probability engine** that models the rotation as sampling without replacement (with a cooldown), so it can estimate the odds of a given chroma appearing next, and how many days it's been since it last did.

##  Key Features

- **Real web scraping with Puppeteer** — launches a real headless Chrome instance to render `rotations.lol/mythic` (a JavaScript-rendered page) and extract the current shop offerings, since the data doesn't exist in the page's raw HTML.
- **Automatic daily sync** — a `node-cron` job runs the scraper once a day on its own, no manual action needed. It can also be triggered on demand from the dashboard.
- **Manual rotation entry** — a form in the dashboard to register a rotation by hand, validated and deduplicated by date, for whenever the live source is down or its layout changes.
- **SQLite persistence** — every chroma, every rotation, and every appearance is stored in a real relational database (`data/mythic.db`), not flat files, with foreign keys and atomic writes (a rotation with an invalid item is rolled back entirely, never left half-written).
- **Discrete probability engine** — pure, dependency-free math module that computes pool exhaustion, next-rotation probability, and days since an item last appeared.
- **Dynamic target selector** — real-time search and filter across the full cosmetic catalog.
- **Diagnostic tooling** — a script that dumps the scraper's rendered HTML and a screenshot to disk, so the CSS selectors can be re-verified and fixed quickly if the source site ever changes its markup.
- **Automated CI pipeline** — GitHub Actions runs the full unit test suite on every push, across multiple Node.js versions. Tests cover the probability engine, the database layer, and the scraper's name-parsing logic directly — without ever hitting the live third-party site, so CI stays fast and doesn't depend on it being online.

##  Architecture
Browser (Dashboard: HTML / CSS / vanilla JS)
│ fetch()
▼
Express REST API (src/server.js)
├── GET /api/catalog
├── GET /api/rotations
├── POST /api/rotations → register a rotation manually
├── GET /api/metrics → probability + full history for a target
└── POST /api/sync → triggers the live scraper on demand
│
├──► DatabaseService SQLite (data/mythic.db)
│ tables: chromas · rotations · rotation_items
│
├──► ProbabilityEngine pure math, no I/O, fully unit tested
│
└──► ScraperService Puppeteer (headless Chrome)
scrapes https://rotations.lol/mythic
runs daily via node-cron, or on demand

##  Tech Stack

| Layer | Technology |
| :--- | :--- |
| Runtime | Node.js 22.5+ (uses the native `node:sqlite` module) |
| Server | Express |
| Database | SQLite (via `node:sqlite`, zero external dependencies) |
| Scraping | Puppeteer (headless Chrome) |
| Scheduling | node-cron |
| Frontend | HTML5 / CSS3 / Vanilla JavaScript |
| Testing | Node's built-in test runner (`node --test`) |
| CI | GitHub Actions |

##  REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/catalog` | Returns every chroma currently known to the system. |
| `GET` | `/api/rotations` | Returns the full rotation history with resolved chroma details. |
| `POST` | `/api/rotations` | Registers a rotation manually. Body: `{ "date": "YYYY-MM-DD", "chromaIds": ["..."] }`. |
| `GET` | `/api/metrics?targetId=:id` | Returns probability metrics, days since last seen, and history for a given target. |
| `POST` | `/api/sync` | Runs the live scraper immediately and registers today's rotation if it's new. |

##  Getting Started

### Prerequisites

- Node.js **v22.5.0** or higher (required for the native `node:sqlite` module)

### Installation

```bash
git clone https://github.com/Joseph-Benjamin-Medina-Sanchez/mythic-shop-tracker.git
cd mythic-shop-tracker
npm install
```

`npm install` also downloads a bundled Chromium for Puppeteer (roughly 300 MB), so this step can take a few minutes.

### Seed the database

The repo ships with sample historical data in `data/*.json`. Import it into SQLite once:

```bash
npm run migrate
```

### Run it

```bash
npm start
```

Then open `http://localhost:3000`. The dashboard lets you search the catalog, see live probability metrics, register a rotation manually, or trigger a live sync from the "Sincronizar Tienda" button. A background job also runs the sync automatically once a day.

### Run the tests

```bash
npm test
```

### Admin utilities

```bash
npm run inspect:source           # dumps the rendered HTML + a screenshot of rotations.lol for debugging selectors
npm run delete-rotation -- 2026-09-06   # removes a rotation by date, e.g. to fix a bad manual entry or a stale sample
```

##  Known Limitations

- **Champion detection is heuristic.** The scraper infers the champion from the item's display name (the word right before a parenthesis, e.g. *"Star Guardian Taliyah (Brilliant)" → Taliyah*). This is accurate for skins and chromas, but not for non-champion Daily items like summoner icons or emotes — that's an accepted trade-off since the tracker's purpose is chroma/skin rotations.
- **The scraper depends on `rotations.lol`'s current markup.** If that site changes its HTML structure, the CSS selectors in `src/services/ScraperService.js` will need updating — run `npm run inspect:source` first to see the current rendered structure.
- **`node:sqlite` is an experimental Node.js API.** It works reliably here, but Node will print an `ExperimentalWarning` on startup — this is expected and harmless.

##  Author

Joseph Medina