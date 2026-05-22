import { execSync } from "node:child_process"
import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const COMPOSE_FILE = path.resolve(
  __dirname,
  "../../infrastructure/local/docker-compose.yml",
)
const BACKUP_FILE = path.resolve(__dirname, "../playwright/.backup/db.dump")

const DB_NAME = "ofsm"
const DB_USER = "postgres"
const DB_PASSWORD = "postgres"

export default async function globalTeardown() {
  if (!fs.existsSync(BACKUP_FILE)) {
    console.warn(
      `⚠ No backup file found at ${BACKUP_FILE} — skipping DB restore.`,
    )
    return
  }

  const containerId = execSync(
    `docker compose -f "${COMPOSE_FILE}" ps -q postgres`,
  )
    .toString()
    .trim()

  if (!containerId) {
    console.warn("⚠ Postgres container not running — skipping DB restore.")
    return
  }

  console.log("▶ Restoring database after test run…")
  execSync(
    `docker exec -i -e PGPASSWORD="${DB_PASSWORD}" "${containerId}" ` +
      `psql --quiet -U "${DB_USER}" -d "${DB_NAME}" ` +
      `< "${BACKUP_FILE}"`,
    { shell: "/bin/bash" },
  )
  fs.rmSync(BACKUP_FILE)
  console.log("  Database restored to pre-test state.")
}
