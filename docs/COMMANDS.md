# Riffle Management Commands

Operational guide for running Riffle with the current infrastructure model:

- **Docker Compose only**
- **Two environments:** `dev` and `prod`
- **No Kubernetes, Kong, or WAF**

---

## 1. Environment Model

Riffle uses `ops/scripts/ctrl.js` as the single control entrypoint.

- `ENV=dev`:
  - no reverse proxy
  - no mTLS
  - devtools enabled (`mailhog`, `httpbin`, `redis-commander`)
- `ENV=prod`:
  - Caddy reverse proxy + automatic HTTPS
  - mTLS enabled between services
  - monitoring and backup layers enabled

---

## 2. Quick Start

### 2.1 Development
```bash
docker network create riffle_network || true
ENV=dev node ops/scripts/ctrl.js up all
```

### 2.2 Production
```bash
docker network create riffle_network || true
ENV=prod node ops/scripts/ctrl.js up all
```

### 2.3 Stop
```bash
ENV=dev node ops/scripts/ctrl.js down all
ENV=prod node ops/scripts/ctrl.js down all
```

---

## 3. Available Targets (`ctrl.js`)

### Common (dev + prod)
```bash
ENV=dev  node ops/scripts/ctrl.js up infra:data
ENV=dev  node ops/scripts/ctrl.js up svc:all
ENV=dev  node ops/scripts/ctrl.js up app:client

ENV=prod node ops/scripts/ctrl.js up infra:data
ENV=prod node ops/scripts/ctrl.js up svc:all
ENV=prod node ops/scripts/ctrl.js up app:client
```

### Dev-only
```bash
ENV=dev node ops/scripts/ctrl.js up dev:tools
```

### Prod-only
```bash
ENV=prod node ops/scripts/ctrl.js up infra:edge
ENV=prod node ops/scripts/ctrl.js up prod:monitor
ENV=prod node ops/scripts/ctrl.js up prod:backup
```

### Aliases
```bash
ENV=dev  node ops/scripts/ctrl.js up infra:all
ENV=prod node ops/scripts/ctrl.js up infra:all

ENV=dev  node ops/scripts/ctrl.js up all
ENV=prod node ops/scripts/ctrl.js up all
```

---

## 4. Manual Docker Compose (Advanced)

Use manual Compose only when you need explicit file-level control.

### 4.1 Dev stack
```bash
docker compose --env-file ops/env/.env.dev \
  -f ops/compose/common/data.yml \
  -f ops/compose/common/services.yml \
  -f ops/compose/common/client.yml \
  -f ops/compose/dev/devtools.yml \
  up -d
```

### 4.2 Prod stack
```bash
docker compose --env-file ops/env/.env.prod \
  -f ops/compose/common/data.yml \
  -f ops/compose/common/services.yml \
  -f ops/compose/common/client.yml \
  -f ops/compose/prod/caddy.yml \
  -f ops/compose/prod/monitor.yml \
  -f ops/compose/prod/backup.yml \
  up -d
```

---

## 5. Logs and Diagnostics

```bash
docker compose ps
docker logs -f service-core-api
docker logs -f infra-caddy
docker logs -f store-game-pg
```

---

## 6. Release and Tooling

```bash
npm run check
npm run format
npm run lint
npm run release
npm run release -- --dry-run
npm run mobile:sync
```

---

## Notes

- Preferred workflow is `ctrl.js` (`ENV=dev|prod`).
- Keep `ops/env/.env.dev` and `ops/env/.env.prod` local and secret.
- For mobile builds (Capacitor), production API access should go through HTTPS domain behind Caddy.
