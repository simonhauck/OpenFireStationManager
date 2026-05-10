#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# neon-to-local.sh
#
# Dumps a Neon (or any remote) PostgreSQL database and restores it into the
# local Docker-Compose postgres instance defined in this directory.
#
# Requirements: Docker (no local psql / pg_dump needed)
#
# Usage:
#   ./neon-to-local.sh <neon-connection-string>
#
# Example:
#   ./neon-to-local.sh "postgres://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

NEON_URL="${1:?Usage: $0 <neon-connection-string>}"

# Must match the image tag in docker-compose.yml so pg_dump and the server are
# protocol-compatible.
POSTGRES_IMAGE="postgres:18"

# Local DB credentials — keep in sync with docker-compose.yml
LOCAL_DB="ofsm"
LOCAL_USER="postgres"
LOCAL_PASSWORD="postgres"

echo "▶ Checking local postgres container…"
CONTAINER_ID=$(docker compose -f "$COMPOSE_FILE" ps -q postgres 2>/dev/null || true)

if [[ -z "$CONTAINER_ID" ]]; then
  echo "✖ Local postgres container is not running."
  echo "  Start it first:"
  echo "    docker compose -f $COMPOSE_FILE up -d"
  exit 1
fi

echo "  Container: $CONTAINER_ID"
echo ""
echo "▶ Dumping from Neon and restoring into local db '$LOCAL_DB'…"
echo "  (this may take a moment depending on database size)"
echo ""

# pg_dump runs inside a throw-away container that can reach the public internet.
# Its stdout is piped directly into psql running inside the local container —
# no temp files or host networking tricks required.
docker run --rm \
  "$POSTGRES_IMAGE" \
  pg_dump \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    "$NEON_URL" \
  | docker exec -i "$CONTAINER_ID" \
      env PGPASSWORD="$LOCAL_PASSWORD" \
      psql --quiet -U "$LOCAL_USER" -d "$LOCAL_DB"

echo ""
echo "✔ Restore complete — local db '$LOCAL_DB' now mirrors Neon."

