import { randomUUID } from "node:crypto"
import { type APIRequestContext, expect, test } from "@playwright/test"
import {
  createSeedRequest,
  seedClothingItem,
  seedClothingLocation,
  seedClothingType,
  seedMember,
} from "../api/seeding"
import { ClothingItemsPage } from "../pages/ClothingItemsPage"
import { MemberDetailPage } from "../pages/MemberDetailPage"

test.use({ storageState: "playwright/.auth/kleiderwart.json" })

test.describe("Clothing Items", () => {
  let api: APIRequestContext
  let typeId: number
  let typeName: string

  test.beforeAll(async () => {
    typeName = `Test-Typ-Items-${randomUUID().slice(0, 8)}`
    api = await createSeedRequest()
    typeId = (await seedClothingType(api, typeName)).id
  })

  test.afterAll(async () => {
    await api.dispose()
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
    request,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const locationName = `Spind-${suffix}`
    const barcode = `BC-Holder-${suffix}`
    const itemsPage = new ClothingItemsPage(page)

    const member = await seedMember(request, memberName)
    const location = await seedClothingLocation(request, {
      name: locationName,
      type: "PERSONAL",
      memberId: member.id,
    })
    await seedClothingItem(request, {
      typeId,
      size: "L",
      barcode,
      locationId: location.id,
    })

    await itemsPage.goto()
    await expect(itemsPage.holderLink(barcode, memberName)).toBeVisible()

    await itemsPage.holderLink(barcode, memberName).click()
    await expect(page).toHaveURL(/\/members\/\d+$/)
    await expect(new MemberDetailPage(page).heading(memberName)).toBeVisible()
  })
})
