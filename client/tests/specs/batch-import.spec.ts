import { expect, test } from "@playwright/test"
import { randomUUID } from "crypto"
import { createClothingType } from "../flows/createClothingType"
import { ClothingItemsPage } from "../pages/ClothingItemsPage"
import { ClothingLocationsPage } from "../pages/ClothingLocationsPage"

test.use({ storageState: "playwright/.auth/kleiderwart.json" })

test.describe("Batch Import", () => {
  let typeName: string

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage({
      storageState: "playwright/.auth/kleiderwart.json",
    })
    typeName = await createClothingType(
      page,
      `Test-Typ-Batch-${randomUUID().slice(0, 8)}`,
    )
    await page.close()
  })

  test("batch imports clothing items", async ({ page }) => {
    const barcode1 = `BC-${randomUUID().slice(0, 8)}`
    const barcode2 = `BC-${randomUUID().slice(0, 8)}`
    const csv = `L,${barcode1}\nM,${barcode2}`

    const itemsPage = new ClothingItemsPage(page)
    await itemsPage.gotoBatchImport()

    await itemsPage.selectBatchType(typeName)
    await itemsPage.fillBatchCsv(csv)
    await itemsPage.clickPreview()
    await itemsPage.clickImport()

    await expect(itemsPage.successMessage()).toBeVisible()
  })

  test("batch imports clothing locations", async ({ page }) => {
    const name1 = `Batch-Standort-${randomUUID().slice(0, 8)}`
    const name2 = `Batch-Standort-${randomUUID().slice(0, 8)}`
    const csv = `${name1},Kommentar A\n${name2}`

    const locationsPage = new ClothingLocationsPage(page)
    await locationsPage.gotoBatchImport()

    await locationsPage.selectBatchType("Pool")
    await locationsPage.fillBatchCsv(csv)
    await locationsPage.clickPreview()
    await locationsPage.clickImport()

    await expect(locationsPage.successMessage()).toBeVisible()
  })
})
