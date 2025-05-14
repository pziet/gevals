#!/usr/bin/env bash
set -euo pipefail

# 1. ensure pnpm is present
command -v pnpm >/dev/null 2>&1 || npm i -g pnpm

# 2. install all workspace deps with Turbo caching
echo "⏳ Installing dependencies…"
pnpm i --frozen-lockfile

# 3. copy env template if missing
[[ -f .env ]] || {
  echo "ℹ️  Creating .env from template"
  cp .env.example .env
}

# 4. check and bootstrap infra
#
# By default:
#   • Postgres maps container port 5432 → host $PG_PORT (default 5432)
#   • Redis   maps container port 6379 → host $REDIS_PORT (default 6379)
#
# If you already have services on those ports, override them:
#   PG_PORT=15432 REDIS_PORT=16379 ./scripts/bootstrap.sh

export PG_PORT="${PG_PORT:-5432}"
export REDIS_PORT="${REDIS_PORT:-6379}"

# fail-fast on port conflicts
for PORT_VAR in PG_PORT REDIS_PORT; do
  PORT_VAL="${!PORT_VAR}"
  if lsof -ti tcp:"$PORT_VAL" >/dev/null; then
    cat <<EOF

⚠️  Port $PORT_VAL is already in use for ${PORT_VAR%,_PORT}.
   • Stop the process using it, OR
   • Re-run with alternate ports:
       PG_PORT=<free> REDIS_PORT=<free> ./scripts/bootstrap.sh

EOF
    exit 1
  fi
done

echo "🚀 Starting infrastructure:"
echo "   • Postgres on host port $PG_PORT"
echo "   • Redis    on host port $REDIS_PORT"
echo "   • Chroma"

docker compose -f infra/docker-compose.yml up -d
