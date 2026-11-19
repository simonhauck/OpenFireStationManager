import { randomUUID } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { request } from "@playwright/test"
import { backupDatabase } from "./db-backup.js"

// Personas are also created as real users (see createUser) because auth.spec.ts still logs in
// with their credentials; their browser session comes from the test-only session endpoint.
const BASE_URL = "http://localhost:8080"
const CLIENT_URL = "http://localhost:3000"

interface Persona {
  username: string
  password: string
  firstName: string
  lastName: string
  roles: string[]
  authFile: string
}

async function createUser(
  apiContext: Awaited<ReturnType<typeof request.newContext>>,
  persona: Omit<Persona, "authFile">,
) {
  const response = await apiContext.post(`${BASE_URL}/api/test/users`, {
    data: {
      username: persona.username,
      password: persona.password,
      firstName: persona.firstName,
      lastName: persona.lastName,
      roles: persona.roles,
    },
  })

  if (!response.ok() && response.status() !== 409) {
    throw new Error(
      `Failed to create test user ${persona.username}: ${response.status()} ${await response.text()}`,
    )
  }
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
        sameSite: "Strict" as const,
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
      password: "testpassword",
      firstName: "Test",
      lastName: "Admin",
      roles: ["ADMIN"],
      authFile: path.join(process.cwd(), "playwright/.auth/admin.json"),
    },
    {
      username: `test-kleiderwart-${runId}`,
      password: "testpassword",
      firstName: "Test",
      lastName: "Kleiderwart",
      roles: ["KLEIDERWART"],
      authFile: path.join(process.cwd(), "playwright/.auth/kleiderwart.json"),
    },
    {
      username: `test-user-${runId}`,
      password: "testpassword",
      firstName: "Test",
      lastName: "User",
      roles: ["USER"],
      authFile: path.join(process.cwd(), "playwright/.auth/user.json"),
    },
  ]

  // Write persona credentials to env so specs can read them
  process.env.E2E_ADMIN_USERNAME = personas[0].username
  process.env.E2E_ADMIN_PASSWORD = personas[0].password
  process.env.E2E_KLEIDERWART_USERNAME = personas[1].username
  process.env.E2E_KLEIDERWART_PASSWORD = personas[1].password
  process.env.E2E_USER_USERNAME = personas[2].username
  process.env.E2E_USER_PASSWORD = personas[2].password

  const apiContext = await request.newContext()

  for (const persona of personas) {
    await createUser(apiContext, persona)
  }

  for (const persona of personas) {
    await saveSession(apiContext, persona)
  }

  await apiContext.dispose()
}
