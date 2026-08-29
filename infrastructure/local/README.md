# Local Infrastructure

This directory contains the Docker Compose configuration for the local PostgreSQL database and a
script for importing the development database from Neon.

## Prerequisites

- Docker with Compose support
- Terraform CLI
- Access to the `OpenFireStationManager` Terraform Cloud workspace

Authenticate Terraform once on your machine if necessary:

```bash
terraform login
```

## Import Development Data

Start the local PostgreSQL container from the repository root:

```bash
docker compose -f infrastructure/local/docker-compose.yml up -d
```

Run the import script:

```bash
./infrastructure/local/neon-to-local.sh
```

Without an argument, the script reads the current direct development database connection from the
`db_urls.develop.data_export` Terraform value. It uses a direct Neon connection because Neon does
not support `pg_dump` reliably through its pooled connection.

The import replaces the local database contents. The script uses `pg_dump --clean --if-exists`, so
existing local tables and data are removed before the development database is restored.

To import from another PostgreSQL database explicitly, pass its connection string:

```bash
./infrastructure/local/neon-to-local.sh "postgresql://user:password@host/database?sslmode=require"
```

