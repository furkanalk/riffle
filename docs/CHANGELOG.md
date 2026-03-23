# Changelog

# 0.5.1 (2026-03-23)

## Infrastructure
- Removed Kubernetes artifacts and legacy compose layout.
- Removed Kong/WAF edge stack and simplified runtime to Docker Compose.
- Introduced new compose layering:
  - `ops/compose/common/*` for shared services
  - `ops/compose/dev/*` for development-only tooling
  - `ops/compose/prod/*` for production-only edge/monitoring/backup
- Added Caddy as production reverse proxy (HTTPS termination, routing, baseline hardening).
- Reduced environment strategy to two modes: `dev` and `prod`.
- Fixed infra config mounts by replacing mistaken directory entries with files:
  - `ops/config/postgres/pg_hba.conf`
  - `ops/config/redis/users.acl`
- Refactored `ops/scripts/ctrl.js` for new layer targets and strict env validation.

## Documentation
- Updated `README.md`, `docs/COMMANDS.md`, `docs/ARCHITECTURE.md`, and `docs/ROADMAP.md`
  to match the compose-only, dev/prod infrastructure model.

# 0.5.0 (2026-01-12)
