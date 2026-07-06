#!/usr/bin/env bash
# Apply Cloudflare Security Insights fixes for arielglow.com (local, no GitHub Actions).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/.env"
  set +a
fi

: "${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID in .env}"

if [[ -z "${CLOUDFLARE_HARDENING_TOKEN:-}" && -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Set CLOUDFLARE_API_TOKEN or CLOUDFLARE_HARDENING_TOKEN in .env" >&2
  echo "See SETUP-CLOUDFLARE-TOKEN.md for required permissions." >&2
  exit 1
fi

export CLOUDFLARE_ACCOUNT_ID
export CLOUDFLARE_API_TOKEN="${CLOUDFLARE_HARDENING_TOKEN:-${CLOUDFLARE_API_TOKEN}}"

python3 "$ROOT/scripts/ensure-cloudflare.py"
