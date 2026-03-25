<h1 align="center">🎸 Riffle: Music Trivia</h1>

<p align="center">
  <img src="https://i.imgur.com/gcf0UUg.png" width="180" alt="Riffle Logo">
</p>

<p align="center">
  <strong>Real-time competitive music quiz engine powered by Modern Web Technologies.</strong><br>
  Designed for scalability, performance, heavy concurrency, and shred. Rock on!
</p>

<p align="center">
  <img src="https://img.shields.io/badge/architecture-Microservices-yellow">
  <img src="https://img.shields.io/badge/stack-Monorepo-black">
  <img src="https://img.shields.io/badge/backend-Node.js%20%7C%20Go-green">
  <img src="https://img.shields.io/badge/edge-Caddy-red">
  <img src="https://img.shields.io/badge/frontend-HTML%20%7C%20JS%20(React%20planned)-blue">
  <img src="https://img.shields.io/badge/infra-Docker%20Compose-purple">
  <img src="https://img.shields.io/badge/license-Proprietary-lightgrey">
  <img src="https://img.shields.io/badge/code_style-Biome-yellow?logo=biome">
  <img src="https://img.shields.io/badge/versioning-SemVer-blue">
</p>

```txt
RIFFLE — INFO

Genre        : Rock • Metal (more TBD)
Architecture : Microservices (Monorepo Managed)
Platform     : Web • Mobile (Planned)
Version      : v0.5.0-alpha

"Test your music knowledge under pressure."
```

## Table of Contents

- [Features](#features)
- [Technical Architecture](#technical-architecture)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Progress](#progress)
- [License](#license)

## Features

### Gameplay & Competition
1. **Real-Time Versus Battles:** Challenge friends or match with random players globally in intense, synchronous music trivia duels.
2. **Diverse Game Modes:** Marathon, Coop, Solo VS, Team VS, Chaos, Custom — each with distinct rules and pacing.
3. **Fair Play Guarantee:** Powered by a **Rust-based Anti-Cheat** engine *(planned)* that prevents bots and audio tampering.
4. **Global Leaderboards:** Climb the ELO-based ranking system. Compete for daily, weekly, and all-time glory.
5. **Community Driven:** Create your own custom quizzes and share them with the community.

### Social, Progression & Economy
6. **Deep Customization:** Unlock unique **Avatars**, profile frames, and audio visualizer themes in the Shop.
7. **Social Hub:** Add friends, create private lobbies, and chat in real-time before matches.
8. **Live Operations:** Participate in **Seasonal Events** and special tournaments with exclusive rewards.
9. **Pro Membership (VIP):** Access exclusive game modes, ad-free experience, and premium cosmetic drops.
10. **Detailed Stats:** Track your progress with comprehensive match history and win rates.

## Technical Architecture

Riffle is structured as a **microservices monorepo**: separate services per domain, shared tooling, single repo. Managed with TurboRepo.

**[Read the Full Architecture Documentation](./docs/ARCHITECTURE.md)**

### Tech Stack Overview

| Component | Technology | Role |
|-----------|------------|------|
| **Frontend** | Vanilla HTML + JS + Tailwind *(React planned)* | User Interface |
| **Core API** | Node.js v22 + Fastify v5 (TypeScript) | Orchestrator, Auth & User Management |
| **Engine** | Go (Golang) | High-Performance Matchmaking Service |
| **Security** | Rust + WASM | Client Integrity & Anti-Cheat *(Planned)* |
| **Edge (prod)** | Caddy | Reverse Proxy, Automatic HTTPS, Security Headers |
| **Data (Active)** | Redis + Worker | Hot Data, Session & Write-Behind Sync |
| **Data (Store)** | PostgreSQL | Cold Data, Persistence & Archival |
| **Observability** | Prom / Grafana / Loki | System Metrics & Distributed Logging *(prod)* |
| **Ops** | Docker Compose | Dev + Prod Containerization |
| **Tooling** | Biome + Release-it + Trapeze | Linting, Versioning & Automation |

### Backend API Endpoints

* **[API Endpoints](./docs/API_ENDPOINTS.md)**: Current list of active and planned REST endpoints.

## Installation & Setup

Riffle follows a layered Docker Compose architecture split into **Data**, **Service**, **App**, and **Edge (prod)** layers.

### Prerequisites
* **Docker Desktop** (running)
* **Node.js v22+**
* **Go (Golang) v1.23+** *(for game-engine development)*
* **Git**

### 1. Clone & Install

```bash
git clone https://github.com/furkanalk/riffle-music-trivia.git
cd riffle-music-trivia
npm install
```

### 2. Security Infrastructure (mTLS Certificates)

Riffle uses mTLS for service-to-service communication in prod. Generate certificates before starting:

```bash
chmod +x ops/scripts/generate-certs.sh
./ops/scripts/generate-certs.sh
```

> Creates `ops/secrets/certs/` with keys for Postgres, Redis, and all microservices.

### 3. Environment Configuration

```bash
cp ops/env/.env.example ops/env/.env.dev
cp ops/env/.env.example ops/env/.env.prod
```

> Set `MTLS_ENABLED=false` in `.env.dev`, `true` in `.env.prod`.

### 4. Start Dev Environment

```bash
npm run start:dev
```

This command: creates the Docker network → starts infra (Postgres, Redis) → starts services (core-api, matchmaker, …) → starts the client → prints the dashboard.

### 5. Dashboard Access

#### Dev
| Service | URL |
| :--- | :--- |
| **Client App** | http://localhost:5173 |
| **Core API** | http://localhost:1968 |
| **Matchmaker** | http://localhost:8080 |

#### Prod
- Public entry: `https://<DOMAIN>` via Caddy
- Grafana: http://localhost:3000

### 6. Stop Services

```bash
npm run stop:all      # stops all containers
npm run restart:dev   # stop + start dev
npm run reset         # stop + prune + start dev
```

### Modular Management

See [`docs/COMMANDS.md`](docs/COMMANDS.md) for the full command reference including individual layer targets.

## Configuration

Riffle uses a centralized configuration strategy managed within `ops/env/`.

### Environment Modes

| Mode | File Used | Features |
|------|-----------|----------|
| **Dev** | `.env.dev` | No mTLS, direct ports, source bind mounts (hot-reload) |
| **Prod** | `.env.prod` | mTLS, Caddy HTTPS edge, monitoring, backup |

**Generate secure keys:**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## Progress

- **Current build:** `v0.5.0` (workspace; alpha-quality)
- **Current stage:** **Stage 4** — Infrastructure Foundation (with overlapping work in Stages 2–3 and early experiments in Stage 6)
- **Active focus:** Docker Compose dev/prod layers, **Core API** (Fastify, auth, PostgreSQL, in-memory rate limits on sensitive routes), **Go matchmaker** (HTTP health + WebSocket `/ws`, optional Redis fan-out), **client** (vanilla JS, i18n EN/TR, avatars, leaderboards, localStorage lobby MVP and optional `?ws=1` matchmaker)

```text
Stage 1: Proof of Concept (PoC)       ██████████ 100%
Stage 2: Gameplay Depth & UX        ███░░░░░░░ ~35%  (modes, leaderboards, UX polish partial)
Stage 3: Platform Architecture       ████████░░ ~85%  (monorepo, services, tooling; Go matchmaker shipped)
Stage 4: Infrastructure Foundation  ██████░░░░ ~60%  (compose, Caddy prod, basic rate limits; hardening TBD)
Stage 5: Production Operations       ██░░░░░░░░ ~15%  (Prom/Grafana/Loki in prod stack; CI/CD TBD)
Stage 6: Expansion & Integrity       █░░░░░░░░░ ~10%  (lobby groundwork; full online sync & anti-cheat TBD)
```

Explore the **[Project Roadmap](./docs/ROADMAP.md)** (full checklist), **[Matchmaker](./docs/MATCHMAKER.md)** (WebSocket service), and **[Changelog](./docs/CHANGELOG.md)**.

## License

Copyright (c) 2025 **Furkan Alkılıç**. All Rights Reserved.

This project is protected by a **Proprietary License**.
See the [LICENSE](./LICENSE) file for the full legal text.

```text
PERMISSIONS SUMMARY:
- Educational Use : You may view and study the source code for learning.
- Commercial Use  : Strictly prohibited.
- Distribution    : Strictly prohibited without explicit written permission.
- Modification    : You may not create derivative works for public release.
```
