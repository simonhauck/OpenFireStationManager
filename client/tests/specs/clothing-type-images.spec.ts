import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createClothingType } from "../flows/createClothingType"
import { ClothingTypesPage } from "../pages/ClothingTypesPage"

test.use({ storageState: "playwright/.auth/kleiderwart.json" })

test.describe("Clothing type barcode images", () => {
  test("uploads an image while creating a type and shows it on the edit page", async ({
    page,
  }) => {
    const name = `Test-Typ-${randomUUID().slice(0, 8)}`
    const typesPage = new ClothingTypesPage(page)

    await typesPage.gotoNew()
    await typesPage.fillForm(name)
    await typesPage.selectImages(["tests/fixtures/barcode.png"])
    await typesPage.submitCreate()

    await expect(page).toHaveURL(/\/clothing-management\/types$/)
    await typesPage.clickEditForType(name)
    await expect(typesPage.typeImageThumbnails()).toHaveCount(1)
  })

  test("deletes an uploaded image on the edit page", async ({ page }) => {
    const name = `Test-Typ-${randomUUID().slice(0, 8)}`
    const typesPage = new ClothingTypesPage(page)

    await createClothingType(page, name)
    await typesPage.goto()
    await typesPage.clickEditForType(name)
    await typesPage.selectImages(["tests/fixtures/barcode.png"])
    await typesPage.uploadSelectedImage()
    await expect(typesPage.typeImageThumbnails()).toHaveCount(1)

    await typesPage.removeImageButton().click()
    await typesPage.confirmRemoveImage()

    await expect(typesPage.typeImageThumbnails()).toHaveCount(0)
  })
})
