#!/usr/bin/env bash
# Boot the production standalone server (same layout as the Docker image:
# .next/static + public copied next to server.js). Listens on 0.0.0.0:8000
# unless PORT/HOSTNAME are overridden.
set -euo pipefail
cd "$(dirname "$0")/.."

STANDALONE=".next/standalone"
mkdir -p "$STANDALONE/.next"
if [ -d ".next/static" ]; then cp -rn .next/static "$STANDALONE/.next/static" 2>/dev/null || true; fi
if [ -d "public" ]; then cp -rn public "$STANDALONE/public" 2>/dev/null || true; fi

export EVIDENCE_DIR="${EVIDENCE_DIR:-$PWD/evidence}"
export PORT="${PORT:-8000}"
# IMPORTANT: bash exports HOSTNAME (system hostname) by default and Next.js standalone
# binds to process.env.HOSTNAME — override unconditionally or it binds 127.0.1.1.
export HOSTNAME=0.0.0.0

exec node "$STANDALONE/server.js"
