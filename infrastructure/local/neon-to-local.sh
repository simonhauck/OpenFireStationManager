#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# neon-to-local.sh
#
# Dumps a Neon (or any remote) PostgreSQL database and restores it into the
# local Docker-Compose postgres instance defined in this directory.
#
# Requirements: Docker and Terraform (no local psql / pg_dump needed)
#
# Usage:
#   ./neon-to-local.sh
#   ./neon-to-local.sh <postgres-connection-string>
#
# With no argument, the direct development connection string is read from the
# Terraform Cloud workspace configured in infrastructure/terraform.
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
TERRAFORM_DIR="$(cd "$SCRIPT_DIR/../terraform" && pwd)"

if [[ "$#" -gt 1 ]]; then
  echo "Usage: $0 [postgres-connection-string]" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required but was not found in PATH." >&2
  exit 1
fi

if [[ "$#" -eq 1 ]]; then
  NEON_URL="$1"
else
  if ! command -v terraform >/dev/null 2>&1; then
    echo "Terraform is required when no connection string is supplied." >&2
    exit 1
  fi

  echo "▶ Reading the development export connection from Terraform…"
  if ! terraform -chdir="$TERRAFORM_DIR" init -input=false -no-color; then
    echo "✖ Terraform initialization failed. Make sure you are logged in with 'terraform login'." >&2
    exit 1
  fi

  if ! NEON_URL="$(printf '%s\n' 'nonsensitive(local.db_urls.develop.data_export)' | terraform -chdir="$TERRAFORM_DIR" console -var='arm_portainer_api_token=unused' -var='ofsm_github_token=unused')"; then
    echo "✖ Could not read the development export connection from Terraform." >&2
    echo "  Make sure you are logged in with 'terraform login' and can access the workspace." >&2
    exit 1
  fi

  # terraform console renders string values with surrounding quotes.
  NEON_URL="${NEON_URL#\"}"
  NEON_URL="${NEON_URL%\"}"
fi

if [[ "$NEON_URL" != postgresql://* && "$NEON_URL" != postgres://* ]]; then
  echo "✖ The source connection is not a PostgreSQL URI." >&2
  exit 1
fi

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
