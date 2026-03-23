# Backend API Endpoints

This document outlines the RESTful API surface and WebSocket events for the Riffle platform.
Status legends: `(Active)`, `(Implemented)`, `(Planned)`.

## 1. Authentication & Identity
> Managed by **Auth Service** (Node.js) backed by Redis.

* `POST /api/auth/register` - Register a new user.
* `POST /api/auth/login` - Authenticate via email/password.
* `POST /api/auth/refresh-token` **(Planned)** - Renew access token using a refresh token.
* `POST /api/auth/logout` **(Planned)** - Invalidate session in Redis.
* `POST /api/auth/verify-email` **(Planned)** - Confirm user email address.
* `POST /api/auth/password-reset` **(Planned)** - Initiate password reset flow.

## 2. User Profile & Social
> Managed by **Gateway** + **Postgres**.

* `GET /api/users/me` **(Planned)** - Get current user's profile and settings.
* `GET /api/users/:id` **(Planned)** - View public profile of another player.
* `GET /api/users/:id/stats` **(Planned)** - Retrieve detailed statistics (Win Rate, Fav Genre, ELO).
* `GET /api/users/me/history` **(Planned)** - Paginated list of past match results.
* `GET /api/leaderboard/global` **(Planned)** - Top players ranked by ELO.
* `POST /api/social/friend-request` **(Planned)** - Send a friend request.

## 3. Game Engine & Content
> Managed by **Game Engine** (Go) & **Deezer Integration**.

### HTTP Endpoints
* `GET /api/tracks/playlist/:id` - Retrieve tracks from a specific playlist.
* `GET /api/content/categories` **(Planned)** - Dynamic list of available genres/modes.
* `POST /api/matchmaking/queue` **(Planned)** - Join the ELO-based matchmaking queue.
* `DELETE /api/matchmaking/queue` **(Planned)** - Leave the queue.

### WebSocket Events (Socket.io)
> Real-time communication for gameplay.

* `Client -> Server`
    * `join_room` - Handshake to enter a game lobby.
    * `submit_answer` - { gameId, answerIndex, timeDelta }.
    * `emote` - Send a reaction/emoji.
* `Server -> Client`
    * `game_start` - Metadata about the match and opponents.
    * `round_start` - Song URL, options, and timer start.
    * `round_result` - Who answered correctly? Updated scores.
    * `game_over` - Final scoreboard and rewards.

## 4. Shop & Economy
> Managed by **Postgres** (Inventory) & **Redis** (Currency).

* `GET /api/shop/items` **(Planned)** - List available avatars, frames, and themes.
* `POST /api/shop/purchase/:id` **(Planned)** - Buy an item using virtual currency.
* `GET /api/users/me/inventory` **(Planned)** - List owned items.
* `PATCH /api/users/me/equip` **(Planned)** - Set active avatar/frame.

## 5. Security & Integrity
> Managed by **Rust WASM** (planned).

* `POST /api/security/integrity-check` **(Planned)** - Client sends WASM-generated token for validation.
* `POST /api/security/report` **(Planned)** - Report a user for cheating or abuse.

## 6. System & Infrastructure
* `GET /health` - Health check (Docker liveness probe).
* `GET /secure-data` - API Key validation test endpoint.
* `GET /metrics` **(Planned)** - Prometheus metrics scraping endpoint.