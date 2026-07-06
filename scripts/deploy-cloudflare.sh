#!/usr/bin/env bash
# Deploy arielglow-website to Cloudflare Pages from your Mac (no GitHub Actions).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env"
  set +a
fi

: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN in .env}"
: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID in .env}"

export CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
export CF_WEB_ANALYTICS_TOKEN="${CF_WEB_ANALYTICS_TOKEN:-}"

npm run build
npx wrangler pages deploy . --project-name=arielglow-website --branch=main --commit-dirty=true
node scripts/notify-search.js
