import { expect, test } from "@playwright/test"
import { randomUUID } from "node:crypto"
import { createClothingType } from "../flows/createClothingType"
import { createClothingItem } from "../flows/createClothingItem"
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

  test("deletes a clothing type with no referenced items (happy path)", async ({
    page,
  }) => {
    const name = `Test-Typ-${randomUUID().slice(0, 8)}`
    const typesPage = new ClothingTypesPage(page)

    await createClothingType(page, name)
    await typesPage.goto()
    await expect(typesPage.typeRow(name)).toBeVisible()

    await typesPage.clickDeleteForType(name)
    await typesPage.confirmDelete()

    await expect(typesPage.typeRow(name)).not.toBeVisible()
  })

  test("shows conflict error when deleting a type that has referenced clothing items", async ({
    page,
  }) => {
    const typeName = `Test-Typ-${randomUUID().slice(0, 8)}`
    const typesPage = new ClothingTypesPage(page)

    await createClothingType(page, typeName)
    await createClothingItem(page, {
      typeName,
      size: "M",
      barcode: `BC-${randomUUID().slice(0, 8)}`,
    })

    await typesPage.goto()
    await typesPage.clickDeleteForType(typeName)
    await typesPage.confirmDelete()

    await expect(typesPage.deleteDialogErrorMessage()).toBeVisible()
    await expect(typesPage.typeRow(typeName)).toBeVisible()
  })

  test("cancels deletion and leaves the list unchanged", async ({ page }) => {
    const name = `Test-Typ-${randomUUID().slice(0, 8)}`
    const typesPage = new ClothingTypesPage(page)

    await createClothingType(page, name)
    await typesPage.goto()
    await expect(typesPage.typeRow(name)).toBeVisible()

    await typesPage.clickDeleteForType(name)
    await typesPage.cancelDelete()

    await expect(typesPage.typeRow(name)).toBeVisible()
  })
})
