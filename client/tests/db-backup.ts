import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const BACKUP_FILE = path.resolve(
  __dirname,
  "../playwright/.backup/db.dump",
)

const POSTGRES_IMAGE = "postgres:18"
const DB_PORT = "5432"
const DB_NAME = "ofsm"
const DB_USER = "postgres"
const DB_PASSWORD = "postgres"

/**
 * Returns the docker network flag and DB host appropriate for the current OS,
 * or `null` if the platform is unsupported (backup/restore will be skipped).
 *
 * - Linux: `--network host` + `localhost` (host networking, no port mapping needed)
 * - macOS: no network flag + `host.docker.internal` (Docker Desktop magic hostname)
 * - Windows: not supported, returns null
 */
function networkArgs(): { flags: string; host: string } | null {
  if (process.platform === "linux") {
    return { flags: "--network host", host: "localhost" }
  }
  if (process.platform === "darwin") {
    return { flags: "", host: "host.docker.internal" }
  }
  return null
}

export function backupDatabase(): void {
  const network = networkArgs()
  if (!network) {
    console.warn(
      `⚠ DB backup is not supported on platform "${process.platform}" — skipping.`,
    )
    return
  }

  const { flags, host } = network
  fs.mkdirSync(path.dirname(BACKUP_FILE), { recursive: true })

  console.log("▶ Backing up database before test run…")
  execSync(
    `docker run --rm ${flags} ` +
      `-e PGPASSWORD="${DB_PASSWORD}" ` +
      `${POSTGRES_IMAGE} ` +
      `pg_dump --no-owner --no-acl --clean --if-exists ` +
      `-h ${host} -p ${DB_PORT} -U "${DB_USER}" -d "${DB_NAME}" ` +
      `> "${BACKUP_FILE}"`,
    { shell: "/bin/bash" },
  )
  console.log(`  Backup written to ${BACKUP_FILE}`)
}

export function restoreDatabase(): void {
  const network = networkArgs()
  if (!network) {
    console.warn(
      `⚠ DB restore is not supported on platform "${process.platform}" — skipping.`,
    )
    return
  }

  const { flags, host } = network
  console.log("▶ Restoring database after test run…")
  execSync(
    `docker run --rm ${flags} -i ` +
      `-e PGPASSWORD="${DB_PASSWORD}" ` +
      `${POSTGRES_IMAGE} ` +
      `psql --quiet -h ${host} -p ${DB_PORT} -U "${DB_USER}" -d "${DB_NAME}" ` +
      `< "${BACKUP_FILE}"`,
    { shell: "/bin/bash" },
  )
  fs.rmSync(BACKUP_FILE)
  console.log("  Database restored to pre-test state.")
}
