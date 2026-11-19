
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

## Keycloak (OIDC provider)

`docker compose up -d` starts PostgreSQL and Keycloak. The realm `ofsm` is imported automatically
from `keycloak/ofsm-realm.json` on first start; no manual steps are needed. Keycloak runs in
`start-dev` mode with an in-container database, so state (including changes made in the admin
console) is discarded when the container is recreated.

```bash
docker compose -f infrastructure/local/docker-compose.yml up -d
```

- Port: `8180` (so it does not clash with the server on 8080 or the client on 3000)
- Issuer URL: `http://localhost:8180/realms/ofsm`
- Discovery: `http://localhost:8180/realms/ofsm/.well-known/openid-configuration`
- Admin console: <http://localhost:8180/admin> (`admin` / `admin`, master realm)
- Account console: <http://localhost:8180/realms/ofsm/account>
- Health: `http://localhost:9000/health/ready` inside the container (management port, used by the
  compose healthcheck; not published to the host)

All credentials below are for local development only and must never be used anywhere else.

### Client

| Setting              | Value                                                          |
| -------------------- | -------------------------------------------------------------- |
| Client ID            | `ofsm`                                                         |
| Client secret        | `ofsm-dev-secret`                                              |
| Redirect URIs        | `http://localhost:8080/*`, `http://localhost:3000/*`           |
| Post-logout redirect | `http://localhost:8080/*`, `http://localhost:3000/*`           |
| Direct access grants | enabled (dev only, for scripted tokens)                        |

### Demo users

The password equals the username. The role names deliberately differ from OFSM's own
(`USER`, `KLEIDERWART`, `ADMIN`) so the role mapping is exercised.

| Username      | Password      | Realm role         |
| ------------- | ------------- | ------------------ |
| `admin`       | `admin`       | `ofsm-admin`       |
| `kleiderwart` | `kleiderwart` | `ofsm-kleiderwart` |
| `user`        | `user`        | `ofsm-user`        |
| `norole`      | `norole`      | none               |

The client carries a realm-roles mapper that writes the roles to `realm_access.roles` in the access
token, the ID token and the UserInfo response.

### Fetch a token with curl

```bash
curl -s http://localhost:8180/realms/ofsm/protocol/openid-connect/token \
  -d grant_type=password -d client_id=ofsm -d client_secret=ofsm-dev-secret \
  -d username=admin -d password=admin -d scope=openid
```

The response contains `access_token` and `id_token`; decode the payload to see
`realm_access.roles` (e.g. with `jq -R 'split(".")[1] | @base64d | fromjson'`). UserInfo:

```bash
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:8180/realms/ofsm/protocol/openid-connect/userinfo
```

### Devcontainer and CI

The devcontainer compose file starts the same Keycloak (same realm file, port 8180 forwarded). Keycloak
shares the app container's network, so the server and the browser both use the issuer
`http://localhost:8180/realms/ofsm`. The CI `e2e` job starts it with
`docker compose ... up -d keycloak --wait` before Playwright.

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
