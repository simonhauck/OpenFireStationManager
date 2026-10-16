import { randomUUID } from "node:crypto"
import { type APIRequestContext, expect, test } from "@playwright/test"
import { createSeedRequest, seedClothingType } from "../api/seeding"
import { ClothingItemsPage } from "../pages/ClothingItemsPage"

test.use({ storageState: "playwright/.auth/kleiderwart.json" })

test.describe("Batch Import", () => {
  let api: APIRequestContext
  let typeName: string

  test.beforeAll(async () => {
    typeName = `Test-Typ-Batch-${randomUUID().slice(0, 8)}`
    api = await createSeedRequest()
    await seedClothingType(api, typeName)
  })

  test.afterAll(async () => {
    await api.dispose()
  })

  test("batch imports clothing items", async ({ page }) => {
    const barcode1 = `BC-${randomUUID().slice(0, 8)}`
    const manufacturerBarcode = `MB-${randomUUID().slice(0, 8)}`
    const csv = `L,${barcode1},${manufacturerBarcode}\nM`

    const itemsPage = new ClothingItemsPage(page)
    await itemsPage.gotoBatchImport()

    await itemsPage.selectBatchType(typeName)
    await itemsPage.fillBatchCsv(csv)
    await itemsPage.clickPreview()
    await itemsPage.clickImport()

    await expect(itemsPage.successMessage()).toBeVisible()
    await expect(itemsPage.itemRow(manufacturerBarcode)).toBeVisible()
  })
})
