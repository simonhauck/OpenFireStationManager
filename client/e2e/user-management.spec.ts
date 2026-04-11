import { expect, test } from "@playwright/test"

import {
  TEST_ADMIN_PASSWORD,
  TEST_ADMIN_USERNAME,
  loginAs,
} from "./helpers/auth"

test.describe("User Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_ADMIN_USERNAME, TEST_ADMIN_PASSWORD)
  })

  test("navigates to user management and shows user table", async ({
    page,
  }) => {
    await page.goto("/user-management")

    await expect(
      page.getByRole("heading", { name: "Nutzermanagement" }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Nutzer erstellen" }),
    ).toBeVisible()

    // The table header should be present
    await expect(
      page.getByRole("columnheader", { name: "Benutzername" }),
    ).toBeVisible()
  })

  test("shows the logged-in admin user in the table", async ({ page }) => {
    await page.goto("/user-management")

    // The admin user we created should be listed
    await expect(
      page.getByRole("cell", { name: TEST_ADMIN_USERNAME }),
    ).toBeVisible()
  })

  test("creates a new user and shows it in the list", async ({ page }) => {
    const uniqueSuffix = Date.now()
    const newUsername = `e2e-user-${uniqueSuffix}`

    await page.goto("/user-management/new")

    await expect(
      page.getByRole("heading", { name: "Nutzer erstellen" }),
    ).toBeVisible()

    await page.getByLabel("Benutzername").fill(newUsername)
    await page.getByLabel("Passwort", { exact: true }).fill("Test1234")
    await page.getByLabel("Passwort bestätigen").fill("Test1234")
    await page.getByLabel("Vorname").fill("E2E")
    await page.getByLabel("Nachname").fill("Tester")

    await page.getByRole("button", { name: "Nutzer erstellen" }).click()

    // Should redirect back to the user list
    await page.waitForURL("**/user-management")

    // New user should appear in the table
    await expect(page.getByRole("cell", { name: newUsername })).toBeVisible()
  })

  test("navigates to edit user page and saves changes", async ({ page }) => {
    await page.goto("/user-management")

    // Click the first edit button in the table
    const firstEditButton = page
      .getByRole("link", { name: /Nutzer .+ bearbeiten/ })
      .first()
    await firstEditButton.click()

    await expect(
      page.getByRole("heading", { name: "Nutzer bearbeiten" }),
    ).toBeVisible()

    // Update first name with a suffix to ensure we change something
    const firstNameInput = page.getByLabel("Vorname")
    const currentFirstName = await firstNameInput.inputValue()
    const updatedFirstName = currentFirstName.endsWith("-edited")
      ? currentFirstName.slice(0, -7)
      : `${currentFirstName}-edited`

    await firstNameInput.fill(updatedFirstName)
    await page.getByRole("button", { name: "Änderungen speichern" }).click()

    // Should redirect back to the user list
    await page.waitForURL("**/user-management")
    await expect(
      page.getByRole("heading", { name: "Nutzermanagement" }),
    ).toBeVisible()
  })

  test("navigates to change password page", async ({ page }) => {
    await page.goto("/user-management")

    // Click the first change-password button
    const firstChangePasswordLink = page
      .getByRole("link", { name: /Passwort .+ ändern/ })
      .first()
    await firstChangePasswordLink.click()

    // Should land on the change-password page
    await expect(page.url()).toContain("change-password")
  })

  test("create user page shows validation when passwords do not match", async ({
    page,
  }) => {
    await page.goto("/user-management/new")

    await page.getByLabel("Benutzername").fill("mismatch-user")
    await page.getByLabel("Passwort", { exact: true }).fill("Test1234")
    await page.getByLabel("Passwort bestätigen").fill("DifferentPass")
    await page.getByLabel("Vorname").fill("Test")
    await page.getByLabel("Nachname").fill("User")

    await page.getByRole("button", { name: "Nutzer erstellen" }).click()

    await expect(
      page.getByText("Passwort und Passwortbestätigung stimmen nicht überein."),
    ).toBeVisible()
  })
})
