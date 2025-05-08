# 1. ensure pnpm is present
command -v pnpm >/dev/null 2>&1 || npm i -g pnpm

# 2. install all workspace deps with Turbo caching
pnpm i --frozen-lockfile

# 3. copy env template if missing
[[ -f .env.local ]] || cp .env.example .env.local

# 4. (optional) spin infra
docker compose up -d   # brings up redis:6-alpine & postgres:15
