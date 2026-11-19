import { randomUUID } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { request } from "@playwright/test"
import { backupDatabase } from "./db-backup.js"

// Personas get their browser session from the test-only session endpoint, without a sign-in at
// the OpenID Connect provider. auth.spec.ts covers the real provider sign-in separately.
const BASE_URL = "http://localhost:8080"
const CLIENT_URL = "http://localhost:3000"

interface Persona {
  username: string
  firstName: string
  lastName: string
  roles: string[]
  authFile: string
}

async function saveSession(
  apiContext: Awaited<ReturnType<typeof request.newContext>>,
  persona: Persona,
) {
  const response = await apiContext.post(`${BASE_URL}/api/test/session`, {
    data: {
      username: persona.username,
      firstName: persona.firstName,
      lastName: persona.lastName,
      roles: persona.roles,
    },
  })

  if (!response.ok()) {
    throw new Error(
      `Failed to create test session for ${persona.username}: ${response.status()} ${await response.text()}`,
    )
  }

  const sessionCookie = response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie")
    .map((header) => header.value)
    .find((value) => value.startsWith("OFSM_AUTH="))

  if (!sessionCookie) {
    throw new Error(`No OFSM_AUTH cookie returned for ${persona.username}`)
  }

  const cookieValue = sessionCookie.split(";")[0].slice("OFSM_AUTH=".length)

  const storageState = {
    cookies: [
      {
        name: "OFSM_AUTH",
        value: cookieValue,
        domain: new URL(CLIENT_URL).hostname,
        path: "/",
        expires: -1,
        httpOnly: true,
        secure: true,
        sameSite: "Lax" as const,
      },
    ],
    origins: [],
  }

  mkdirSync(path.dirname(persona.authFile), { recursive: true })
  writeFileSync(persona.authFile, JSON.stringify(storageState, null, 2))
}

export default async function globalSetup() {
  // ── DB backup ─────────────────────────────────────────────────────────────
  // Dump the current database state before any test data is written so that
  // global-teardown can restore it afterwards, keeping the DB clean.
  backupDatabase()

  const runId = randomUUID().slice(0, 8)

  const personas: Persona[] = [
    {
      username: `test-admin-${runId}`,
      firstName: "Test",
      lastName: "Admin",
      roles: ["ADMIN"],
      authFile: path.join(process.cwd(), "playwright/.auth/admin.json"),
    },
    {
      username: `test-kleiderwart-${runId}`,
      firstName: "Test",
      lastName: "Kleiderwart",
      roles: ["KLEIDERWART"],
      authFile: path.join(process.cwd(), "playwright/.auth/kleiderwart.json"),
    },
    {
      username: `test-user-${runId}`,
      firstName: "Test",
      lastName: "User",
      roles: ["USER"],
      authFile: path.join(process.cwd(), "playwright/.auth/user.json"),
    },
  ]

  const apiContext = await request.newContext()

  for (const persona of personas) {
    await saveSession(apiContext, persona)
  }

  await apiContext.dispose()
}
