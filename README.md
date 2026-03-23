<h1 align="center">🎸 Riffle: Music Trivia</h1>

<p align="center">
  <img src="https://imgur.com/dkZQodk.png" width="180" alt="Riffle Logo">
</p>

<p align="center">
  <strong>Real-time competitive music quiz engine powered by Modern Web Technologies.</strong><br>
  Designed for scalability, performance, heavy concurrency, and shred. Rock on!
</p>

<p align="center">
  <img src="https://img.shields.io/badge/architecture-Microservices-yellow">
  <img src="https://img.shields.io/badge/stack-Monorepo-black">
  <img src="https://img.shields.io/badge/backend-Node.js%20%7C%20Go-green">
  <img src="https://img.shields.io/badge/security-Rust%20(WASM)-orange">
  <img src="https://img.shields.io/badge/edge-Caddy-red">
  <img src="https://img.shields.io/badge/frontend-React%20%7C%20TypeScript-blue">
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
Version      : v0.5.1-alpha

“Test your music knowledge under pressure.”
```

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Features](#features)
  - [Gameplay \& Competition](#gameplay--competition)
  - [Social, Progression \& Economy](#social-progression--economy)
- [Technical Architecture](#technical-architecture)
  - [Tech Stack Overview](#tech-stack-overview)
  - [Backend API Endpoints](#backend-api-endpoints)
- [Installation \& Setup](#installation--setup)
  - [Prerequisites](#prerequisites)
  - [1. Setup \& Installation](#1-setup--installation)
  - [2. Security Infrastructure (mTLS Certificates)](#2-security-infrastructure-mtls-certificates)
  - [3. Environment Configuration](#3-environment-configuration)
  - [4. Create Network (if needed)](#4-create-network-if-needed)
  - [5. Start the Ecosystem](#5-start-the-ecosystem)
  - [6. Dashboard Access (Quick Links)](#6-dashboard-access-quick-links)
  - [7. Stop Services](#7-stop-services)
  - [Modular Management](#modular-management)
  - [QoL (npm) Scripts](#qol-npm-scripts)
- [Configuration](#configuration)
  - [Environment Templates](#environment-templates)
  - [Environment Modes](#environment-modes)
- [Progress](#progress)
  - [Roadmap Status](#roadmap-status)
  - [Active Stage Breakdown (Stage 3 \& 4)](#active-stage-breakdown-stage-3--4)
- [License](#license)

## Features

<img src="https://i.imgur.com/BT6O05h.png" width="450" height="150" alt="Feature Preview 1">

### Gameplay & Competition
1.  **Real-Time Versus Battles:** Challenge friends or match with random players globally in intense, synchronous music trivia duels.
2.  **Diverse Game Modes:** Test your endurance in **Marathon Mode**, survive the chaos in **Sudden Death**, or relax with **Classic Mode**.
3.  **Fair Play Guarantee:** Powered by a **Rust-based Anti-Cheat** engine that prevents bots and audio tampering, ensuring a purely skill-based environment.
4.  **Global Leaderboards:** Climb the ELO-based ranking system. Compete for daily, weekly, and all-time glory.
5.  **Community Driven:** Create your own custom quizzes, share them with the community, and play user-generated content.

<img src="https://i.imgur.com/PDjGzKP.png" width="450" height="150" alt="Feature Preview 2">

### Social, Progression & Economy
6.  **Deep Customization:** Unlock unique **Avatars**, profile frames, and audio visualizer themes in the Shop.
7.  **Social Hub:** Add friends, create private lobbies, and chat in real-time before matches.
8.  **Live Operations:** Participate in **Seasonal Events** (e.g., Halloween Rock Fest) and special tournaments with exclusive rewards.
9.  **Pro Membership (VIP):** Access exclusive game modes, ad-free experience, and premium cosmetic drops.
10. **Detailed Stats:** Track your progress with comprehensive match history, win rates, and create a "Favorites" list of songs you discovered while playing.

## Technical Architecture

Riffle is structured as a **microservices monorepo**: separate services per domain, shared tooling, single repo. Managed with TurboRepo for consistent builds and atomic deployments.

**[Read the Full Architecture Documentation](./docs/ARCHITECTURE.md)** for a deep dive into our design decisions, security layers, and scaling strategy.

### Tech Stack Overview

| Component | Technology | Role |
|-----------|------------|------|
| **Frontend** | React 18 + Vite | User Interface & Global State (Zustand) |
| **Core API** | Node.js v22 + Fastify v5 (TypeScript) | Orchestrator, Auth & User Management |
| **Engine** | Go (Golang) | High-Performance Matchmaking Service |
| **Security (Core)** | Rust + WASM | Client Integrity & Anti-Cheat (Planned) |
| **Edge** | Caddy + mTLS | Reverse Proxy, HTTPS, Rate Limiting |
| **Data (Active)**| Redis + Worker | Hot Data, Session & Write-Behind Sync |
| **Data (Store)** | PostgreSQL | Cold Data, Persistence & Archival |
| **Observability**| Prom / Grafana / Loki | System Metrics & Distributed Logging |
| **Ops** | Docker Compose | Multi-Environment Containerization |
| **Tooling** | Biome + Release-it + Trapeze | Linting, Versioning & Automation |

### Backend API Endpoints

* **[API Endpoints](./docs/API_ENDPOINTS.md)**: Current list of active and planned REST endpoints.

## Installation & Setup

Riffle follows a layered Docker Compose architecture.
The system is split into **Edge (prod)**, **Data**, **Service**, and **App** layers.

### Prerequisites
* **Docker Desktop** (running)
* **Node.js v22+** (Required for Vite/Client)
* **Go (Golang) v1.21+** (Required for Game Engine Development)
* **Rust & Cargo** (only required when working on the planned WASM security module)
* **Git**

### 1. Setup & Installation

```bash
# Clone the repository
git clone [https://github.com/furkanalk/riffle.git](https://github.com/furkanalk/riffle.git)
cd riffle

# Install dependencies (Installs Turbo, Cross-Env, and Packages)
npm install
```

### 2. Security Infrastructure (mTLS Certificates)

Riffle uses mTLS (Mutual TLS) for service-to-service communication. You must generate the Root CA and Service Certificates before starting the system.

```bash
# Make the script executable (Linux/Mac/WSL)
chmod +x ops/scripts/generate-certs.sh

# Generate Certificates
./ops/scripts/generate-certs.sh
```
> **Note:** This will create a `ops/secrets/certs` directory containing keys for Postgres, Redis, and all microservices.

### 3. Environment Configuration

Copy the template to create your environment files. The system uses a 2-environment strategy.

```bash
# Create the Development environment file
cp ops/env/.env.example ops/env/.env.dev

# Create production environment file
cp ops/env/.env.example ops/env/.env.prod
```
> **Note:** `MTLS_ENABLED=false` in `dev`, `true` in `prod`.

### 4. Create Network (if needed)

```bash
docker network create riffle_network
```

### 5. Start the Ecosystem

Choose the mode that fits your current task:

#### Option A: Development
```bash
ENV=dev node ops/scripts/ctrl.js up all
```

#### Option B: Production-like local run
```bash
ENV=prod node ops/scripts/ctrl.js up all
```

### 6. Dashboard Access (Quick Links)

Access methods depend on your running environment (`dev` vs `prod`).

#### A. Dev Mode (Default)
Directly accessible via localhost ports mapped by Docker Compose.

| Service | URL (Localhost) | Credentials (Default) |
| :--- | :--- | :--- |
| **Client App** | [http://localhost:5173](http://localhost:5173) | N/A |
| **Core API** | [http://localhost:1968](http://localhost:1968) | `RIFFLE_API_KEY` (Check .env) |
| **MailHog** | [http://localhost:8025](http://localhost:8025) | N/A |
| **Redis Commander** | [http://localhost:8081](http://localhost:8081) | N/A |

#### B. Prod Mode
- Public entry: `https://<DOMAIN>` via Caddy
- Grafana: [http://localhost:3000](http://localhost:3000)

### 7. Stop Services

```bash
# Stops all containers and removes orphans
npm run stop:all

# Hard Reset (Stop + Clean Volumes + Restart)
npm run reset
```

### Modular Management

For the complete list of modular management commands, see [`docs/COMMANDS.md`](docs/COMMANDS.md).

### QoL (npm) Scripts

For all operational commands, see [`docs/COMMANDS.md`](docs/COMMANDS.md).

## Configuration

Riffle uses a centralized configuration strategy managed within the `ops/env/` directory.

### Environment Templates
Instead of guessing variables, use the master template:

1.  **Locate the Template:** [`ops/env/.env.example`](ops/env/.env.example)
2.  **Create your Environment:**
    ```bash
    cp ops/env/.env.example ops/env/.env.dev
    ```
3.  **Customize:** Edit `.env.dev` to match your local secrets.

### Environment Modes
The system behaves differently based on the `ENV` variable:

| Mode | File Used | Features |
|------|-----------|----------|
| **Dev** | `.env.dev` | No mTLS, direct ports, devtools enabled |
| **Prod** | `.env.prod` | mTLS, Caddy HTTPS edge, monitoring, backup |

**Generate secure API keys:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
# Or using OpenSSL (if installed)
openssl rand -hex 16
```

## Progress

- **Current Stage:** `Stage 4`
- **Active Phase:** Phase 1: Compose Orchestration

Explore the **[Project Roadmap](./docs/ROADMAP.md)** for architecture decisions, security layers, and scaling strategy.

### Roadmap Status
```text
Stage 1: Proof of Concept (PoC)       ██████████ 100%  (Core gameplay validated)
Stage 2: Gameplay Depth & UX          ██░░░░░░░░ 20%  (Advanced mechanics & polish pending)
Stage 3: Platform Architecture        ████████░░ 80%  (Monorepo, services, tooling largely done)
Stage 4: Infrastructure Foundation    ████░░░░░░ 40%  ← current
Stage 5: Production Operations        ░░░░░░░░░░ 0%   (GitOps, secrets, observability planned)
Stage 6: Expansion & Integrity        ░░░░░░░░░░ 0%   (Mobile & anti-cheat planned)
```

### Active Phase Breakdown (Stage 4: Phase 1)
```text
- Local Lab (Docker)     ██████████ 100% (Compose modularization complete)
- Prod Edge (Caddy)      ███████░░░ 70%  (HTTPS + routing complete, hardening pending)
- Observability/Backup   ███░░░░░░░ 30%  (baseline services added)
- Security Hardening      ░░░░░░░░░░ 0%  (planned)
```

Review the **[Changelog](./docs/CHANGELOG.md)** for a complete history of features, changes, and releases.

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