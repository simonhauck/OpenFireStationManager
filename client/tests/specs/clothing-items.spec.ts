import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createClothingItem } from "../flows/createClothingItem"
import { createClothingLocation } from "../flows/createClothingLocation"
import { createClothingType } from "../flows/createClothingType"
import { createMember } from "../flows/createMember"
import { ClothingItemsPage } from "../pages/ClothingItemsPage"
import { MemberDetailPage } from "../pages/MemberDetailPage"

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

    if (!id) throw new Error("Expected the item ID cell to contain text")
    await itemsPage.clickEditForItem(id.trim())
    await itemsPage.fillSize("XL")
    await itemsPage.submitForm()

    await expect(page).toHaveURL(/\/clothing-management\/items$/)
    await expect(itemsPage.itemRow(barcode)).toBeVisible()
  })

  test("shows the holder of an item and links to the member detail page", async ({
    page,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const locationName = `Spind-${suffix}`
    const barcode = `BC-Holder-${suffix}`
    const itemsPage = new ClothingItemsPage(page)

    await createMember(page, memberName)
    await createClothingLocation(page, {
      type: "PERSONAL",
      name: locationName,
      memberName,
    })
    await createClothingItem(page, {
      typeName,
      size: "L",
      barcode,
      locationName,
    })

    await itemsPage.goto()
    await expect(itemsPage.holderLink(barcode, memberName)).toBeVisible()

    await itemsPage.holderLink(barcode, memberName).click()
    await expect(page).toHaveURL(/\/members\/\d+$/)
    await expect(new MemberDetailPage(page).heading(memberName)).toBeVisible()
  })
})
