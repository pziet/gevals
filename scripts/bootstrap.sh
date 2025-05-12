# 1. ensure pnpm is present
command -v pnpm >/dev/null 2>&1 || npm i -g pnpm

# 2. install all workspace deps with Turbo caching
pnpm i --frozen-lockfile

# 3. copy env template if missing
[[ -f .env ]] || cp .env.example .env

# 4. (optional) spin infra
docker compose -f infra/docker-compose.yml up -d   # brings up redis:6-alpine & postgres:15, and chroma
