#  Mythic Shop Tracker - A League of Legends Project

A clean-architecture JavaScript utility designed to model, track, and forecast the rotation of exclusive cosmetics in the League of Legends Mythic Shop.

##  Problem Overview
The weekly chroma section in League of Legends rotates 8 exclusive event/mythic chromas every 7 days without prior announcements. 

This project implements a sampling without replacement probability model to quantify the likelihood of a target cosmetic (such as *Galaxy Slayer Zed — Crimson Fang*) appearing in upcoming cycles.

##  Architecture
* **Domain Models (`src/models/`):** Immutable entities with defensive validation.
* **Engine (`src/engine/`):** Pure mathematical calculations decoupled from I/O.
* **Zero Dependencies:** Built on native ECMAScript modules and verified with `node:test`.

##  Getting Started

```bash
npm start
npm test