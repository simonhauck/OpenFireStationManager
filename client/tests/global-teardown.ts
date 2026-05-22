import fs from "node:fs"
import { BACKUP_FILE, restoreDatabase } from "./db-backup.js"

export default async function globalTeardown() {
  if (!fs.existsSync(BACKUP_FILE)) {
    console.warn(
      `⚠ No backup file found at ${BACKUP_FILE} — skipping DB restore.`,
    )
    return
  }

  restoreDatabase()
}
