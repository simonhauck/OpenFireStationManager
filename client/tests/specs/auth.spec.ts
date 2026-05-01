import { expect, test } from "@playwright/test"
import { LoginPage } from "../pages/LoginPage"

test.describe("Auth", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/\/login/)
  })

  test("shows error message on invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login("nonexistent-user", "wrongpassword")
    await expect(loginPage.errorMessage()).toBeVisible()
  })

  test("logs in successfully and redirects away from login", async ({
    page,
  }) => {
    const username = process.env.E2E_USER_USERNAME!
    const password = process.env.E2E_USER_PASSWORD!

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(username, password)
    await expect(page).not.toHaveURL(/\/login/)
  })
})
