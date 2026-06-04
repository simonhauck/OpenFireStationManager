import { expect, test } from "@playwright/test"
import { randomUUID } from "node:crypto"
import { createClothingType } from "../flows/createClothingType"
import { createClothingLocation } from "../flows/createClothingLocation"
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

  test("shows German error when creating an item with a duplicate barcode", async ({
    page,
  }) => {
    const barcode = `BC-DUP-${randomUUID().slice(0, 8)}`
    const itemsPage = new ClothingItemsPage(page)

    await itemsPage.gotoNew()
    await itemsPage.selectType(typeName)
    await itemsPage.fillSize("L")
    await itemsPage.fillBarcode(barcode)
    await itemsPage.submitForm()
    await expect(page).toHaveURL(/\/clothing-management\/items$/)

    await itemsPage.gotoNew()
    await itemsPage.selectType(typeName)
    await itemsPage.fillSize("M")
    await itemsPage.fillBarcode(barcode)
    await itemsPage.submitForm()

    await expect(page).toHaveURL(/\/clothing-management\/items\/new$/)
    await expect(itemsPage.formErrorAlert()).toHaveText(
      `Der Barcode '${barcode}' ist bereits in Verwendung.`,
    )
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

  test("can clear a selected location back to no location", async ({
    page,
  }) => {
    const barcode = `BC-${randomUUID().slice(0, 8)}`
    const locationName = `Loc-${randomUUID().slice(0, 8)}`
    const itemsPage = new ClothingItemsPage(page)

    // Create a location to assign
    await createClothingLocation(page, { type: "POOL", name: locationName })

    // Create an item with the location
    await itemsPage.gotoNew()
    await itemsPage.selectType(typeName)
    await itemsPage.fillSize("M")
    await itemsPage.fillBarcode(barcode)
    await itemsPage.selectLocation(locationName)
    await itemsPage.submitForm()
    await expect(page).toHaveURL(/\/clothing-management\/items$/)

    // Edit the item and clear the location
    const row = itemsPage.itemRow(barcode)
    const idCell = row.getByRole("cell").first()
    const id = await idCell.textContent()

    await itemsPage.clickEditForItem(id!.trim())

    // The clear button should be visible because a location is selected
    await expect(
      page.getByRole("button", { name: "Auswahl zurücksetzen" }),
    ).toBeVisible()

    await itemsPage.clearLocation()

    // After clearing, the placeholder "Kein Standort" should be shown
    await expect(page.getByText("Kein Standort")).toBeVisible()

    // Clear button should be gone
    await expect(
      page.getByRole("button", { name: "Auswahl zurücksetzen" }),
    ).not.toBeVisible()

    // Submit and verify save succeeds (navigates back to list)
    await itemsPage.submitForm()
    await expect(page).toHaveURL(/\/clothing-management\/items$/)
    await expect(itemsPage.itemRow(barcode)).toBeVisible()
  })
})
