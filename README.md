# 🌌 Mythic Shop Tracker - A League of Legends Project

[![Node.js CI](https://github.com/Joseph-Benjamin-Medina-Sanchez/mythic-shop-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Joseph-Benjamin-Medina-Sanchez/mythic-shop-tracker/actions/workflows/ci.yml)
![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-green)
![Express](https://img.shields.io/badge/Express-4.x%20%7C%205.x-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

A full-stack JavaScript application designed to model, track, and forecast the rotation of exclusive event and mythic cosmetics in the League of Legends Mythic Shop.

## 📌 Problem Overview
In the updated League of Legends store rotation architecture, 8 exclusive chromas rotate every 7 days (Wednesday at 4:00 PM PST / Thursday 00:00:00 UTC) without prior announcement in patch notes. 

This project provides an automated tracking system and a **sampling without replacement (with cooldown)** probability engine to determine the likelihood of target items appearing in upcoming weekly cycles.

## 🚀 Key Features
* **Discrete Probability Engine:** Evaluates pool exhaustion and conditional probability per rotation.
* **Dynamic Target Selector:** Real-time search and filter across the complete cosmetic catalog.
* **Decoupled Persistence Layer:** Clean separation between business models, repository storage, and REST controllers.
* **Live Ingestion & Sync Service:** Fetches active shop rotations and dynamically registers newly introduced cosmetics.
* **Official Reset Countdown:** Real-time timer synchronised with Riot's global reset schedule.
* **Automated CI Pipeline:** Continuous integration workflow verifying unit tests on multiple Node.js runtimes.

## 🏗️ Architecture Overview
[ Frontend: HTML5 / CSS3 / Vanilla JS ]
│  (HTTP / Fetch)
▼
[ Backend: Express.js REST API ]
├── GET  /api/catalog
├── GET  /api/metrics?targetId=:id
└── POST /api/sync
│
┌────────┴────────┐
▼                 ▼
[ StorageService ]   [ ProbabilityEngine ]
(data/*.json)     (Domain Math Models)

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/catalog` | Retrieves all registered mythic and event chromas. |
| `GET` | `/api/metrics?targetId=:id` | Returns probability metrics and history for a given target. |
| `POST` | `/api/sync` | Ingests the latest live rotation and updates the local store. |

## 🛠️ Getting Started

### Prerequisites
* Node.js v18.0.0 or higher

### Installation
```bash
git clone [https://github.com/Joseph-Benjamin-Medina-Sanchez/mythic-shop-tracker.git](https://github.com/Joseph-Benjamin-Medina-Sanchez/mythic-shop-tracker.git)
cd mythic-shop-tracker
npm install

Execution
Run the web server:
npm start

Access the dashboard at http://localhost:3000.

Running Tests
Execute unit tests using the native Node.js test runner:
npm test

Author 
Joeph Medina

