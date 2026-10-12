import { randomUUID } from "node:crypto"
import { type APIRequestContext, expect, test } from "@playwright/test"
import {
  createSeedRequest,
  seedClothingItem,
  seedClothingLocation,
  seedClothingType,
} from "../api/seeding"
import { PoolKlamottenPage } from "../pages/PoolKlamottenPage"
import { RelocationPage } from "../pages/RelocationPage"

// Relocation is guarded to KLEIDERWART role.
test.use({ storageState: "playwright/.auth/kleiderwart.json" })

test.describe("Umlagerung (Relocation)", () => {
  let api: APIRequestContext
  let typeName: string
  let barcode1: string
  let barcode2: string
  let targetLocationName: string

  test.beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8)
    typeName = `Typ-Relocation-${suffix}`
    barcode1 = `BC-REL-A-${suffix}`
    barcode2 = `BC-REL-B-${suffix}`
    const sourceLocationName = `Pool-Src-${suffix}`
    targetLocationName = `Pool-Target-${suffix}`

    api = await createSeedRequest()
    const type = await seedClothingType(api, typeName)
    const source = await seedClothingLocation(api, {
      name: sourceLocationName,
      type: "POOL",
    })
    await seedClothingItem(api, {
      typeId: type.id,
      size: "L",
      barcode: barcode1,
      locationId: source.id,
    })
    await seedClothingItem(api, {
      typeId: type.id,
      size: "XL",
      barcode: barcode2,
      locationId: source.id,
    })
    await seedClothingLocation(api, {
      name: targetLocationName,
      type: "POOL",
    })
  })

  test.afterAll(async () => {
    await api.dispose()
  })

  test("completes the full relocation flow and items are moved to target", async ({
    page,
  }) => {
    const relocationPage = new RelocationPage(page)
    const poolPage = new PoolKlamottenPage(page)

    await relocationPage.goto()
    await expect(page.getByText("Schritt 1: Ziel wählen")).toBeVisible()
    await relocationPage.selectTargetLocation(targetLocationName)

    await expect(page.getByText("Schritt 2: Kleidung scannen")).toBeVisible()
    await relocationPage.scanBarcode(barcode1)
    await expect(relocationPage.scannedItem(`${typeName} – L`)).toBeVisible()

    await relocationPage.scanBarcode(barcode2)
    await expect(relocationPage.scannedItem(`${typeName} – XL`)).toBeVisible()

    await relocationPage.clickWeiter()

    await expect(page.getByText("Schritt 3: Überprüfen")).toBeVisible()
    await expect(page.getByText(targetLocationName)).toBeVisible()
    await expect(page.getByText(`${typeName} – L`)).toBeVisible()
    await expect(page.getByText(`${typeName} – XL`)).toBeVisible()
    await relocationPage.submitRelocation()

    await expect(relocationPage.successHeading()).toBeVisible()
    await expect(page.getByText(targetLocationName)).toBeVisible()

    await relocationPage.navigateToOverviewButton().click()
    await expect(page).toHaveURL(/\/pool-clothing/)
    await expect(poolPage.loadingIndicator()).not.toBeVisible()
  })
})
