import { expect, test } from "@playwright/test"
import { LoginPage } from "../pages/LoginPage"

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

test.describe("Auth", () => {
  test("shows error message on invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login("nonexistent-user", "wrongpassword")
    await expect(loginPage.errorMessage()).toBeVisible()
  })

  test("logs in successfully and redirects away from login", async ({
    page,
  }) => {
    const username = requiredEnv("E2E_USER_USERNAME")
    const password = requiredEnv("E2E_USER_PASSWORD")

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(username, password)
    await expect(page).not.toHaveURL(/\/login/)
  })
})

test.describe("Auth – redirect after login", () => {
  // /pool-clothing/checkout is guarded by RoleGuard with allowedRoles=["USER"]
  const protectedRoute = "/pool-clothing/checkout"

  test("unauthenticated user visiting a protected route is redirected to login", async ({
    page,
  }) => {
    await page.goto(protectedRoute)
    await expect(page).toHaveURL(/\/login/)
  })

  test("login URL contains the original protected route as redirect param", async ({
    page,
  }) => {
    await page.goto(protectedRoute)
    await expect(page).toHaveURL(/redirect=/)
    await expect(page).toHaveURL(/pool-clothing/)
  })

  test("after login the user is redirected back to the originally requested page", async ({
    page,
  }) => {
    const username = requiredEnv("E2E_USER_USERNAME")
    const password = requiredEnv("E2E_USER_PASSWORD")

    await page.goto(protectedRoute)
    await expect(page).toHaveURL(/\/login/)

    const loginPage = new LoginPage(page)
    await loginPage.login(username, password)

    await expect(page).toHaveURL(/\/pool-clothing\/checkout/)
  })

  test("after redirect-login the login page is not in the history stack", async ({
    page,
  }) => {
    const username = requiredEnv("E2E_USER_USERNAME")
    const password = requiredEnv("E2E_USER_PASSWORD")

    await page.goto(protectedRoute)
    await expect(page).toHaveURL(/\/login/)

    const loginPage = new LoginPage(page)
    await loginPage.login(username, password)
    await expect(page).toHaveURL(/\/pool-clothing\/checkout/)

    await page.goBack()
    await expect(page).not.toHaveURL(/\/login/)
  })
})
