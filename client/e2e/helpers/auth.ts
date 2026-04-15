import type { Page } from "@playwright/test"

export const TEST_ADMIN_USERNAME = "testadmin"
export const TEST_ADMIN_PASSWORD = "Test1234"

export const TEST_KLEIDERWART_USERNAME = "testkleiderwart"
export const TEST_KLEIDERWART_PASSWORD = "Test1234"

/**
 * Logs in via the login page and waits until the app redirects away from /login.
 */
export async function loginAs(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await page.goto("/login")
  await page.getByLabel("Benutzername").fill(username)
  await page.getByLabel("Passwort").fill(password)
  await page.getByRole("button", { name: "Anmelden" }).click()
  // Wait until we leave the login page
  await page.waitForURL((url) => !url.pathname.endsWith("/login"))
}
