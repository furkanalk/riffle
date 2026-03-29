# Riffle Roadmap

- **Current build:** `v0.7.0-alpha` (workspace; alpha-quality feature set)
- **Current focus:** Stage 4 (infrastructure) with overlapping product work in Stages 2–3 (client UX, i18n, social) and early Stage 6 experiments.

This roadmap is organized by **capability maturity**, not linear feature completion. Stages may overlap intentionally as the platform evolves.

---

## Recent progress (snapshot)

Delivered or materially improved since the last roadmap pass:

- **Core API:** In-memory per-IP rate limiting on auth and leaderboard routes (`simpleRateLimit`); no extra npm dependency. Docker dev entrypoint mitigates stale `node_modules` under bind mounts. Social-oriented REST endpoints (friends, presence, notifications) alongside existing auth/profile patterns.
- **Matchmaker (Go):** `apps/game-engine` — HTTP health, WebSocket `/ws` for lobby state, optional Redis pub/sub for multi-instance fan-out. See [MATCHMAKER.md](./MATCHMAKER.md).
- **Client:** Guest avatar gate, profile avatar/username for registered users, **EN/TR i18n** across main menu, categories/setup, lobby, **game round / marathon UI** (`gamePage`), and shared UI chrome; leaderboard API integration (end-game podium + main menu preview); quick-play–style modes; localStorage lobby MVP and optional `?ws=1` matchmaker connection. **App preferences** (language, music preview volume, reduced motion, larger touch targets) with `localStorage` persistence. **Ambient effects** module: drifting lyrics + cursor note particles on index, categories, and game (`ambient-effects.css` / `ambient-effects.js`); reduced motion hides lyrics layer; note layer uses a high z-index. **Main menu:** update/news card on mobile under cards; on desktop, same card **fixed bottom-right**. Settings panel no longer duplicates a “game setup” shortcut to categories (Play flow remains primary).
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
  - [x] **Marathon (solo) — v1 complete:** Unlimited or fixed **question count** from setup; **exactly one starting life** (no unlimited-lives mode); **+1 life every 10 questions** at checkpoints; game over at zero lives; checkpoint pulse + copy on the round summary; round HUD and summary strings **EN/TR** (`gamePage` in `i18n.js`). Optional tuning later: difficulty curve, marathon-specific leaderboards, anti-abuse.

- [ ] **Phase 2: Smart Algorithms & Data Quality**
  - [x] **Plausible wrong answers (MCQ)** — **partial:** Song questions prefer other tracks by the same artist, then same album, then the rest of the category playlist. Artist questions use other artists from the same playlist (same genre pool). Album questions prefer other album titles from the pool. Distractors use trimmed / case-insensitive matching so near-duplicates do not steal a slot. Padding to four options never duplicates the correct answer (only repeats wrong labels if the pool is tiny). Implemented in `apps/client/src/game/game-engine.js` (`generateAnswerOptions`).
  - [ ] **Metadata validation & sanitization** — stronger checks at import or API (titles, artists, albums); larger minimum unique counts per category where data allows.

- [ ] **Phase 3: UI / UX Polish**
  - [x] Animations & transitions — **partial:** Tailwind + custom CSS; ambient lyrics/notes; app-level reduced motion and large-tap targets.
  - [x] Category filtering & navigation — **partial:** type/era/artist filters, mobile filter sheets, category setup UX.
  - [x] Landing page & menu refinement — **partial:** favicon branding, mode grid, leaderboard preview, profile/auth panels, i18n EN/TR, desktop news card placement, preferences panel.

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

- [x] **Phase 1: Local Orchestration**
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

*Last updated: 2026-03-28 — Marathon v1 (checkpoint UX + game i18n); plausible MCQ distractors.*
