# Matchmaker (Go) — status and roadmap

This document summarizes **recent work** and **planned work** for the real-time lobby / matchmaker service under `apps/game-engine`. For the broader architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Recently completed

### Go service (`apps/game-engine`)

- **HTTP**
  - `GET /health` — JSON: `{"ok":true,"service":"matchmaker"}`
  - `GET /lobbies` — JSON: `{ "lobbies": [ ... ] }` — open, non-stale rooms with at least one connected WebSocket client (lobby name, mode, privacy flags, host display name / `hostUserId` when JWT present, player counts, timestamps). Proxied to the web client as `GET /api/matchmaker/lobbies` via **core-api** (`MATCHMAKER_HTTP_URL`, default `http://127.0.0.1:8080`).
- **WebSocket** — `GET /ws` (query parameters)
  - `room` — 6-character `[A-Z0-9]` room code
  - `clientId` — client identity (for reconnects)
  - `name`, `avatar`, `required` — lobby parameters
  - `token` — optional JWT (same `JWT_SECRET` as `core-api`, `id` claim)
- **Server → client message types**
  - `room_state` — player list, host, `requiredCount`, `started`, plus lobby metadata: `lobbyName`, `mode`, `isPrivate`, `friendsOnly`, `hostUserId`, `createdAt`, `lastSeenAt`
  - `game_started` — broadcast when the host starts the game
  - `pong` — response to `ping`
  - `error` — when `start_game` is rejected: `not_host`, `already_started`, `lobby_not_ready`
- **Client → server**
  - `ping` / `ready` / `start_game`
- **Reconnect** — If a new socket opens with the same `clientId`, the previous connection is closed and the handler waits until cleanup completes; `joinOrder` stays consistent.
- **Redis (optional)** — If `PING` succeeds against `REDIS_ADDR` or `REDIS_HOST` (+ `:6379`), multi-instance fan-out uses channel `riffle:matchmaker`; `origin` (instance UUID) prevents publish loops.
- **Docker** — `apps/game-engine/dockerfile` (`dev` / `prod` targets), Compose exposes `8080:8080`, sets `JWT_SECRET`, `WEBSOCKET_ALLOWED_ORIGINS` (from `CORS_ORIGIN`), `depends_on: active-game-redis`.

### Client (vanilla JS)

- Default lobby still uses **localStorage + `storage` events** (MVP).
- For the real matchmaker: **`?ws=1`** in the URL or `localStorage.setItem("riffle_use_ws_matchmaker", "1")`.
- Custom WebSocket base URL: `localStorage.riffle_matchmaker_ws` or `window.__RIFFLE_MATCHMAKER_WS__` (otherwise `ws(s)://<host>:8080/ws`).
- On categories flow, the host’s “Start” calls `sendMatchmakerStartGame()` so the server receives `start_game` (`category-game.js` → `room-sim.js`).

---

## Planned / suggested next steps

### Short term

1. **Surface errors in the UI** — For WebSocket messages with `type: "error"`, show a toast or inline text (the server already sends them; the client often ignores them today).
2. **Connection lifecycle** — After `onclose` / `onerror`, offer “Reconnect” or a short countdown with automatic reconnect (keeping the room code).
3. **i18n** — Move error copy into the TR/EN `i18n` dictionary.

### Medium term

4. **Real-time game sync** — Lobby is on the matchmaker; for questions, timers, and scores, either extend the same WebSocket protocol or define a separate protocol / service for the game engine.
5. **Redis TLS / ACL** — In production, encrypted Redis access or ACL-backed authentication for `go-redis`.
6. **Observability** — Prometheus metrics (connections, rooms, Redis publish failures), structured logging.

### Long term

7. **Durable room state** — Full authority may require Redis (or another store) plus TTL; today state is in-memory with optional fan-out.
8. **Load balancing** — Sticky sessions or a fully Redis-authoritative state model; document a clear strategy for multiple matchmaker replicas.

---

## Related files

| Area | Location |
|------|----------|
| Go entrypoint | `apps/game-engine/cmd/matchmaker/main.go` |
| Hub / WebSocket / Redis | `apps/game-engine/internal/hub/hub.go` |
| JWT | `apps/game-engine/internal/auth/jwt.go` |
| Docker | `apps/game-engine/dockerfile` |
| Compose (service) | `ops/compose/common/services.yml` (`matchmaker`) |

---

*Last updated: aligned with matchmaker reconnect handling, `start_game` errors, Redis fan-out, and this document.*
