import { expect, test } from "@playwright/test"
import { randomUUID } from "crypto"
import { ClothingTypesPage } from "../pages/ClothingTypesPage"

test.use({ storageState: "playwright/.auth/kleiderwart.json" })

test.describe("Clothing Types", () => {
  test("creates a new clothing type and shows it in the list", async ({
    page,
  }) => {
    const name = `Test-Typ-${randomUUID().slice(0, 8)}`
    const typesPage = new ClothingTypesPage(page)

    await typesPage.goto()
    await typesPage.createButton().click()
    await typesPage.fillForm(name)
    await typesPage.submitCreate()

    await expect(page).toHaveURL(/\/clothing-management\/types$/)
    await expect(typesPage.typeRow(name)).toBeVisible()
  })

  test("edits an existing clothing type", async ({ page }) => {
    const name = `Test-Typ-${randomUUID().slice(0, 8)}`
    const updatedName = `${name}-bearbeitet`
    const typesPage = new ClothingTypesPage(page)

    // Create via UI first
    await typesPage.gotoNew()
    await typesPage.fillForm(name)
    await typesPage.submitCreate()
    await expect(page).toHaveURL(/\/clothing-management\/types$/)

    // Edit it
    await typesPage.clickEditForType(name)
    await typesPage.fillForm(updatedName)
    await typesPage.submitEdit()

    await expect(page).toHaveURL(/\/clothing-management\/types$/)
    await expect(typesPage.typeRow(updatedName)).toBeVisible()
  })
})
