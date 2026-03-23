# Riffle Roadmap

- **Current Build:** `v0.5.0-alpha`
- **Current Stage:** `Stage 4: Infrastructure Foundation`

This roadmap is organized by **capability maturity**, not linear feature completion.
Stages may overlap intentionally as the platform evolves.

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
  - [ ] Marathon / extended game modes.
  - [ ] Smarter difficulty progression.

- [ ] **Phase 2: Smart Algorithms & Data Quality**
  - [ ] Context-aware wrong answer generation.
  - [ ] Metadata validation & sanitization.

- [ ] **Phase 3: UI / UX Polish**
  - [ ] Animations & transitions (Tailwind).
  - [ ] Category filtering & navigation.
  - [ ] Landing page & menu refinement.

---

## Stage 3: Platform Architecture & Tooling
> *Refactoring into a scalable, maintainable platform.*

- [x] **Phase 1: Structural Overhaul**
  - [x] Monorepo setup (TurboRepo, Apps/Ops split).
  - [x] Service separation (Core API, Worker, Engine).
  - [x] Multi-environment strategy (Dev/Prod).

- [x] **Phase 2: Developer Tooling**
  - [x] Biome (linting & formatting).
  - [x] Commitlint & Husky.
  - [x] Release-it.
  - [x] Trapeze (mobile config).

- [ ] **Phase 3: Runtime Communication**
  - [ ] Typed WebSocket layer (Socket.io + Zod).
  - [ ] Inter-service HTTP communication (Node ↔ Go).

---

## Stage 4: Infrastructure Foundation
> *Establishing a production-ready container baseline.*

- [ ] **Phase 1: Local Orchestration**
  - [x] Docker Compose modularization (common/dev/prod layers).
  - [x] Environment simplification to Dev + Prod.

- [ ] **Phase 2: Edge & Security**
  - [x] Caddy reverse proxy in prod.
  - [x] Automatic HTTPS termination in prod.
  - [ ] Hardened rate-limit and abuse policies.
  - [ ] JWT/session hardening pass.

- [ ] **Phase 3: Reliability**
  - [x] PostgreSQL backup service in prod stack.
  - [ ] Backup restore drill automation.
  - [ ] Healthcheck and restart policy audit for all services.

---

## Stage 5: Production Operations
> *Automation, delivery, and observability.*

- [ ] **Phase 1: GitOps & Delivery**
  - [ ] ArgoCD continuous deployment.
  - [ ] Environment promotion strategy.

- [ ] **Phase 2: Secrets & Configuration**
  - [ ] HashiCorp Vault integration.
  - [ ] Secret rotation & config externalization.

- [ ] **Phase 3: Observability**
  - [ ] Metrics & logs (Prometheus, Grafana, Loki).
  - [ ] Distributed tracing (Tempo).

---

## Stage 6: Expansion & Competitive Integrity
> *Scaling the platform and ensuring fair play.*

- [ ] **Platform Expansion**
  - [ ] Mobile builds (iOS & Android via Capacitor).
  - [ ] Real-time multiplayer VS mode.

- [ ] **Competitive Integrity**
  - [ ] Rust-based security core.
  - [ ] WebAssembly (WASM) client integration.
