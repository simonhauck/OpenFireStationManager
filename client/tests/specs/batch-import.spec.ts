import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createClothingType } from "../flows/createClothingType"
import { ClothingItemsPage } from "../pages/ClothingItemsPage"

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
})
