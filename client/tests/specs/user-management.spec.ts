import { expect, test } from "@playwright/test"
import { randomUUID } from "node:crypto"
import { UserManagementPage } from "../pages/UserManagementPage"

test.use({ storageState: "playwright/.auth/admin.json" })

test.describe("User Management", () => {
  test("creates a new user and shows them in the list", async ({ page }) => {
    const username = `test-new-user-${randomUUID().slice(0, 8)}`
    const userPage = new UserManagementPage(page)

    await userPage.goto()
    await userPage.createButton().click()

    await userPage.fillUsername(username)
    await userPage.fillFirstName("Max")
    await userPage.fillLastName("Mustermann")
    await userPage.fillPassword("testpassword")
    await userPage.fillConfirmPassword("testpassword")
    await userPage.submitCreate()

    await expect(page).toHaveURL(/\/user-management$/)
    await expect(userPage.userRow(username)).toBeVisible()
  })

  test("edits an existing user", async ({ page }) => {
    const username = `test-edit-user-${randomUUID().slice(0, 8)}`
    const userPage = new UserManagementPage(page)

    // Create user first
    await userPage.gotoNew()
    await userPage.fillUsername(username)
    await userPage.fillFirstName("Hans")
    await userPage.fillLastName("Alt")
    await userPage.fillPassword("testpassword")
    await userPage.fillConfirmPassword("testpassword")
    await userPage.submitCreate()
    await expect(page).toHaveURL(/\/user-management$/)

    // Edit user
    await userPage.clickEditForUser(username)
    await userPage.fillFirstName("Hans")
    await userPage.fillLastName("Neu")
    await userPage.submitEdit()

    await expect(page).toHaveURL(/\/user-management$/)
    await expect(userPage.userRow(username)).toBeVisible()
  })
})
