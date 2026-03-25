#!/bin/sh
set -e
# Bind mounts replace /app; an anonymous node_modules volume may be stale after
# package.json changes. Ensure critical deps exist before tsx watch starts.
if ! node -e "require.resolve('@fastify/rate-limit')" 2>/dev/null; then
  echo "[core-api] Missing dependencies (e.g. after package.json change). Running npm install..."
  npm install
fi
exec "$@"
