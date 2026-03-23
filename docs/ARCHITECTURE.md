# Riffle Technical Architecture

Riffle is designed as a modular, scalable system that prioritizes performance, security, and future service separation without premature complexity.

## Table of Contents

- [Riffle Technical Architecture](#riffle-technical-architecture)
  - [Table of Contents](#table-of-contents)
  - [Monorepo Structure](#monorepo-structure)
  - [Technology Stack](#technology-stack)
    - [1. Frontend (Client)](#1-frontend-client)
    - [2. Backend API \& Authentication](#2-backend-api--authentication)
    - [3. Game Engine (Computation Core)](#3-game-engine-computation-core)
    - [4. Security Core (Planned)](#4-security-core-planned)
    - [5. Data \& State Management](#5-data--state-management)
    - [6. Edge \& Observability](#6-edge--observability)
  - [Infrastructure Model](#infrastructure-model)
  - [Internal Service Discovery](#internal-service-discovery)
  - [Security Architecture](#security-architecture)
  - [Scaling \& Failure Assumptions](#scaling--failure-assumptions)
    - [1. Scalability](#1-scalability)
    - [2. Data Consistency \& State](#2-data-consistency--state)
    - [3. Failure Scenarios](#3-failure-scenarios)
  - [Request Flow (High-Level)](#request-flow-high-level)

## Monorepo Structure

Riffle is designed as a **Fully Distributed System**. Code is organized by domain responsibilities.

```text
riffle/
├── apps/
│   ├── client/           # [React] Frontend application
│   ├── core-api/         # [Node.js] Main orchestrator (Auth/User)
│   ├── game-engine/      # [Go] Matchmaker & Scoring Logic
│   ├── worker/           # [Node.js] DB Sync (Write-Behind Pattern)
│   ├── store-service/    # [Node.js] Economy & Inventory
│   └── music-service/    # [Node.js] Deezer/Spotify Integration
│
├── ops/
│   ├── compose/          # Compose layers (common/dev/prod)
│   ├── config/           # Dashboard & Tool configurations
│   ├── env/              # Per-environment configuration (.env.dev, .env.prod)
│   ├── scripts/          # Automation scripts (ctrl.js, dashboard.js)
│   └── secrets/          # mTLS Certs & Keys (GitIgnored)
│
└── packages/             # Shared logic (UI, DB Schema, Types)
```

## Technology Stack

### 1. Frontend (Client)
* **Framework:** React 18 + Vite
* **Language:** TypeScript
* **State Management:**
  * **Zustand:** Global client state
  * **React Query:** Server state & caching
* **Styling:** Tailwind CSS + Radix UI
* **Platform:** Web-first, Capacitor-compatible (iOS / Android)

> The client is responsible only for rendering, user input, and real-time communication. No authoritative game state or scoring logic exists on the client.

### 2. Backend API & Authentication
* **Runtime:** Node.js
* **Framework:** Fastify
* **Language:** TypeScript
* **Protocols:** REST + WebSocket (Socket.io)

**Responsibilities:**
* API routing and request lifecycle
* Authentication & authorization
* Session handling
* Schema-based input validation
* WebSocket connection management

> Fastify is selected for its low overhead, predictable performance, and strict schema validation model.

### 3. Game Engine (Computation Core)
* **Language:** Go (Golang)
* **Communication:** Internal HTTP / gRPC (planned)
* **Execution Model:** Stateless

**Responsibilities:**
* Score calculation
* Matchmaking logic (ELO-based)
* Ranking computation
* High-concurrency, CPU-bound operations

> Go is used for workloads where Node.js may become a bottleneck due to its single-threaded execution model. Goroutines enable efficient parallel computation under heavy load.

### 4. Security Core (Planned)
* **Language:** Rust
* **Target:** WebAssembly (WASM)

**Responsibilities:**
* Client integrity verification
* Audio stream fingerprint validation
* Bot and automation detection
* Runtime tamper detection

> Rust is reserved for security-critical and real-time workloads due to its memory safety guarantees, zero garbage collection pauses, and resistance to reverse engineering when compiled to WASM.

### 5. Data & State Management
* **PostgreSQL**
  * Persistent data
  * Users, profiles, match history, metadata
* **Redis**
  * Live game rooms
  * Session tokens
  * Leaderboards
  * Pub/Sub for internal coordination

> All backend services are **stateless**. Any instance can be terminated or scaled without state loss.

### 6. Edge & Observability
* **Caddy (prod):** Reverse proxy, automatic HTTPS, basic rate limiting and security headers.
* **Prometheus:** Metrics collection.
* **Grafana:** Visualization dashboard.
* **Loki:** Log aggregation.

> Dev runs without reverse proxy (direct container port mapping). Prod uses Caddy as the only public entrypoint.

## Infrastructure Model

Riffle currently uses a Compose-only infrastructure strategy with two environments:

- **Dev:** `ops/compose/common/*` + `ops/compose/dev/devtools.yml`
- **Prod:** `ops/compose/common/*` + `ops/compose/prod/{caddy,monitor,backup}.yml`

Kubernetes, Kong, and WAF layers are intentionally removed to keep operational complexity aligned with the current product stage.

## Internal Service Discovery

Riffle uses Docker service discovery over a shared user-defined network (`riffle_network`).

| Layer      | Service / Role       | Docker Hostname        | Port |
|:-----------|:---------------------|:-----------------------|:-----|
| Edge (prod)| Caddy                | `infra-caddy`          | 80/443 |
| Active     | Redis (hot state)    | `active-game-redis`    | 6379 |
| Store      | PostgreSQL           | `store-game-pg`        | 5432 |
| Service    | Core API             | `service-core-api`     | 1968 |
| Service    | Matchmaker           | `service-matchmaker`   | 8080 |
| Service    | Store Service        | `service-store`        | 3000 |
| Service    | Music Service        | `service-music`        | 3000 |
| Worker     | Async Worker         | `service-worker`       | N/A |
| Monitor    | Prometheus (prod)    | `monitor-prometheus`   | 9090 |
| Monitor    | Grafana (prod)       | `monitor-grafana`      | 3000 |

## Security Architecture

Riffle follows a defense-in-depth model sized for current product scope.

- **Transport security**
  - HTTPS termination at Caddy in prod
  - mTLS-ready service-to-service setup in prod environment
- **Edge controls**
  - Basic IP rate limiting at Caddy
  - Security headers at Caddy
- **Application controls**
  - Schema-based validation and auth in API layer
  - Role/permission checks per endpoint
- **Future integrity controls**
  - Rust/WASM module for anti-cheat and runtime checks

## Scaling & Failure Assumptions

### 1. Scalability
- **Horizontal Scaling:** All Service Layer containers (API, Engine, Store) are stateless and can scale horizontally behind the Gateway.
- **Database Scaling:** PostgreSQL is the single source of truth; read-replicas can be added for analytics. Redis handles high-throughput write operations.

### 2. Data Consistency & State
- **Eventual Consistency:** Due to the **Write-Behind** pattern, data in PostgreSQL (Store Layer) is eventually consistent. Real-time game state exists in the Active Layer (Redis) first.
- **Persistence & Backup:** - The `active-worker` service ensures data durability by moving completed match data from Redis to PostgreSQL asynchronously.
  - A dedicated `pg-backup` sidecar container performs automated daily backups of the PostgreSQL database to a secure volume, ensuring recovery point objectives (RPO) are met even in catastrophic failure scenarios.

### 3. Failure Scenarios
- **Service Failure:** If `core-api`, `matchmaker` or other services fail, they restart automatically. No state is lost as state lives in Redis/PostgreSQL.
- **Edge Failure:** If Caddy fails in prod, public API access is interrupted, but internal services and data remain intact.
- **Active Layer Failure:** If Redis fails critically without persistence, **live** match progress may be lost, but historical data (Postgres) remains secure.
- **Isolation:** A failure in the edge layer does not compromise the data store layer.

## Request Flow (High-Level)

1. **User:** Request enters via Internet.
2. **Edge (prod):** Caddy terminates HTTPS and applies base edge policies.
3. **Routing:** Caddy routes `/api/*` to `core-api` and `/ws/*` to `matchmaker`; static traffic goes to `client`.
4. **Logic:** Node.js/Go services process the request.
5. **Data:** Active state is handled in Redis, persistent state in PostgreSQL.

> No direct client-to-engine communication exists outside the controlled API/edge flow.