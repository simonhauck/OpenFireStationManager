/**
 * Global setup for Playwright e2e tests.
 *
 * Creates the initial admin user and a KLEIDERWART test user.
 * Both steps are idempotent — failures are silently ignored when users
 * already exist.
 */

const BASE_URL = "http://localhost:8080"

const ADMIN_USERNAME = "testadmin"
const ADMIN_PASSWORD = "Test1234"
const ADMIN_FIRST_NAME = "Test"
const ADMIN_LAST_NAME = "Admin"

const KLEIDERWART_USERNAME = "testkleiderwart"
const KLEIDERWART_PASSWORD = "Test1234"
const KLEIDERWART_FIRST_NAME = "Test"
const KLEIDERWART_LAST_NAME = "Kleiderwart"

async function globalSetup() {
  // Step 1: Try to create the initial admin user via the setup endpoint.
  // If this fails the user is already created — that is fine.
  await fetch(`${BASE_URL}/api/public/setup/initial-admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
    }),
  }).catch(() => {
    // ignore network errors
  })

  // Step 2: Log in as admin to obtain a session cookie.
  const loginRes = await fetch(`${BASE_URL}/api/public/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      rememberMe: false,
    }),
  })

  if (!loginRes.ok) {
    throw new Error(
      `Global setup: admin login failed with status ${loginRes.status}. ` +
        "Make sure the backend is running on port 8080.",
    )
  }

  const setCookieHeader = loginRes.headers.get("set-cookie") ?? ""
  const sessionCookie = setCookieHeader.split(";")[0]

  // Step 3: Try to create the KLEIDERWART test user.
  // If this fails the user is already created — that is fine.
  await fetch(`${BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      username: KLEIDERWART_USERNAME,
      password: KLEIDERWART_PASSWORD,
      firstName: KLEIDERWART_FIRST_NAME,
      lastName: KLEIDERWART_LAST_NAME,
      roles: ["KLEIDERWART"],
    }),
  }).catch(() => {
    // ignore network errors
  })
}

export default globalSetup
