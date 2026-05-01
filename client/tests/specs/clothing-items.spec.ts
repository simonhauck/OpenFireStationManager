import { expect, test } from "@playwright/test"
import { randomUUID } from "node:crypto"
import { createClothingType } from "../flows/createClothingType"
import { ClothingItemsPage } from "../pages/ClothingItemsPage"

test.use({ storageState: "playwright/.auth/kleiderwart.json" })

test.describe("Clothing Items", () => {
  let typeName: string

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage({
      storageState: "playwright/.auth/kleiderwart.json",
    })
    typeName = await createClothingType(
      page,
      `Test-Typ-Items-${randomUUID().slice(0, 8)}`,
    )
    await page.close()
  })

  test("creates a new item and shows it in the list", async ({ page }) => {
    const barcode = `BC-${randomUUID().slice(0, 8)}`
    const itemsPage = new ClothingItemsPage(page)

    await itemsPage.gotoNew()
    await itemsPage.selectType(typeName)
    await itemsPage.fillSize("L")
    await itemsPage.fillBarcode(barcode)
    await itemsPage.submitForm()

    await expect(page).toHaveURL(/\/clothing-management\/items$/)
    await expect(itemsPage.itemRow(barcode)).toBeVisible()
  })

  test("edits an existing item", async ({ page }) => {
    const barcode = `BC-${randomUUID().slice(0, 8)}`
    const itemsPage = new ClothingItemsPage(page)

    await itemsPage.gotoNew()
    await itemsPage.selectType(typeName)
    await itemsPage.fillSize("M")
    await itemsPage.fillBarcode(barcode)
    await itemsPage.submitForm()
    await expect(page).toHaveURL(/\/clothing-management\/items$/)

    const row = itemsPage.itemRow(barcode)
    const idCell = row.getByRole("cell").first()
    const id = await idCell.textContent()

    await itemsPage.clickEditForItem(id!.trim())
    await itemsPage.fillSize("XL")
    await itemsPage.submitForm()

    await expect(page).toHaveURL(/\/clothing-management\/items$/)
    // The barcode should still be visible in the updated row
    await expect(itemsPage.itemRow(barcode)).toBeVisible()
  })

  test("deletes an item", async ({ page }) => {
    const barcode = `BC-${randomUUID().slice(0, 8)}`
    const itemsPage = new ClothingItemsPage(page)

    await itemsPage.gotoNew()
    await itemsPage.selectType(typeName)
    await itemsPage.fillSize("S")
    await itemsPage.fillBarcode(barcode)
    await itemsPage.submitForm()
    await expect(page).toHaveURL(/\/clothing-management\/items$/)
    await expect(itemsPage.itemRow(barcode)).toBeVisible()

    const row = itemsPage.itemRow(barcode)
    const idCell = row.getByRole("cell").first()
    const id = await idCell.textContent()

    await itemsPage.clickDeleteForItem(id!.trim())
    await itemsPage.confirmDelete()

    await expect(itemsPage.itemRow(barcode)).not.toBeVisible()
  })
})
