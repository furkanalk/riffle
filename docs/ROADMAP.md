# Riffle Roadmap

- **Current build:** `v0.5.0` (workspace; alpha-quality feature set)
- **Current focus:** Stage 4 (infrastructure) with overlapping product work in Stages 2–3 and early Stage 6 experiments.

This roadmap is organized by **capability maturity**, not linear feature completion. Stages may overlap intentionally as the platform evolves.

---

## Recent progress (snapshot)

Delivered or materially improved since the last roadmap pass:

- **Core API:** In-memory per-IP rate limiting on auth and leaderboard routes (`simpleRateLimit`); no extra npm dependency. Docker dev entrypoint mitigates stale `node_modules` under bind mounts.
- **Matchmaker (Go):** `apps/game-engine` — HTTP health, WebSocket `/ws` for lobby state, optional Redis pub/sub for multi-instance fan-out. See [MATCHMAKER.md](./MATCHMAKER.md).
- **Client:** Guest avatar gate, profile avatar/username for registered users, EN/TR i18n, leaderboard API integration (end-game podium + main menu preview), quick-play–style modes, localStorage lobby MVP and optional `?ws=1` matchmaker connection.
- **Security / data:** Parameterized SQL, server-side username rules, JWT profile updates.

Still intentionally narrow or simulated: full online matchmaking at scale, authoritative in-game sync, custom rooms listing, chaos/custom unlocked modes.

---

## Stage 1: Proof of Concept (PoC)

> *Validating the core idea with minimal viable gameplay.*

- [x] **Phase 1: Core Gameplay Loop**
  - [x] Music playback during active sessions.
  - [x] Timed question answering.
  - [x] Basic score calculation.

- [x] **Phase 2: Initial UI**
  - [x] Question view & answer selection.
  - [x] Timer bar & basic audio visualizer.

---

## Stage 2: Gameplay Depth & UX

> *Making the game engaging, replayable, and user-friendly.*

- [ ] **Phase 1: Advanced Gameplay Mechanics**
  - [ ] Playlist engine (unique tracks per session).
  - [x] Marathon / extended modes — **basic** marathon-style flow (deeper tuning TBD).
  - [ ] Smarter difficulty progression.

- [ ] **Phase 2: Smart Algorithms & Data Quality**
  - [ ] Context-aware wrong answer generation.
  - [ ] Metadata validation & sanitization.

- [ ] **Phase 3: UI / UX Polish**
  - [ ] Animations & transitions (Tailwind).
  - [ ] Category filtering & navigation (beyond current category picker).
  - [ ] Landing page & menu refinement — **partial:** favicon branding, mode grid, leaderboard preview, profile/auth panels, i18n.

- [ ] **Phase 4: Accounts & Leaderboards (client + API)**
  - [x] REST leaderboard and score submission for authenticated users.
  - [x] End-of-game podium + main menu leaderboard preview.
  - [ ] Deeper stats, seasons, and anti-abuse on scores.

---

## Stage 3: Platform Architecture & Tooling

> *Refactoring into a scalable, maintainable platform.*

- [x] **Phase 1: Structural Overhaul**
  - [x] Monorepo setup (TurboRepo, Apps/Ops split).
  - [x] Service separation (Core API, Worker, game-engine / matchmaker).
  - [x] Multi-environment strategy (Dev/Prod).

- [x] **Phase 2: Developer Tooling**
  - [x] Biome (linting & formatting).
  - [x] Commitlint & Husky.
  - [x] Release-it.
  - [x] Trapeze (mobile config).

- [ ] **Phase 3: Runtime Communication**
  - [x] **Go matchmaker** — WebSocket lobby, optional Redis fan-out ([MATCHMAKER.md](./MATCHMAKER.md)).
  - [ ] Typed real-time contract (e.g. shared schema + codegen) across client ↔ matchmaker ↔ core-api.
  - [ ] Inter-service HTTP/gRPC where needed (Node ↔ Go) beyond current REST usage.

---

## Stage 4: Infrastructure Foundation

> *Establishing a production-ready container baseline.*

- [ ] **Phase 1: Local Orchestration**
  - [x] Docker Compose modularization (common/dev/prod layers).
  - [x] Environment simplification to Dev + Prod.

- [ ] **Phase 2: Edge & Security**
  - [x] Caddy reverse proxy in prod.
  - [x] Automatic HTTPS termination in prod.
  - [x] **Basic** rate limiting on sensitive API routes (in-process; per-instance).
  - [ ] Distributed / edge rate limiting and abuse policies (Redis, Caddy, or both).
  - [ ] JWT/session hardening pass (rotation, revocation, Redis sessions if required).

- [ ] **Phase 3: Reliability**
  - [x] PostgreSQL backup service in prod stack.
  - [ ] Backup restore drill automation.
  - [ ] Healthcheck and restart policy audit for all services (including matchmaker).

---

## Stage 5: Production Operations

> *Automation, delivery, and observability.*

- [ ] **Phase 1: CI/CD Delivery**
  - [ ] GitHub Actions pipeline (build → push → deploy via SSH + docker compose pull).
  - [ ] Environment promotion strategy (dev → prod gate).

- [ ] **Phase 2: Secrets & Configuration**
  - [ ] Secret rotation policy and externalized config (env + secrets management).

- [ ] **Phase 3: Observability**
  - [x] Metrics & logs baseline (Prometheus, Grafana, Loki in prod stack).
  - [ ] Distributed tracing (Tempo + OpenTelemetry) for cross-service visibility.

---

## Stage 6: Expansion & Competitive Integrity

> *Scaling the platform and ensuring fair play.*

- [ ] **Platform Expansion**
  - [ ] Mobile builds (iOS & Android via Capacitor).
  - [ ] **Real-time multiplayer VS mode** — matchmaker + lobby groundwork exists; authoritative in-game sync and matchmaking at scale remain open.

- [ ] **Competitive Integrity**
  - [ ] Rust-based security core.
  - [ ] WebAssembly (WASM) client integration.

---

*Last updated: roadmap refresh (matchmaker, rate limiting, client/leaderboard progress).*
