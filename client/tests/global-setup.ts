import { chromium, request } from "@playwright/test"
import { randomUUID } from "crypto"
import path from "path"

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

async function loginAndSave(persona: Persona) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`${CLIENT_URL}/login`)
  await page.locator("#username").fill(persona.username)
  await page.locator("#password").fill(persona.password)
  await page.getByRole("button", { name: "Anmelden" }).click()
  await page.waitForURL((url) => !url.pathname.includes("/login"))

  await context.storageState({ path: persona.authFile })
  await browser.close()
}

export default async function globalSetup() {
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

  await apiContext.dispose()

  for (const persona of personas) {
    await loginAndSave(persona)
  }
}
