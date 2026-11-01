import { randomUUID } from "node:crypto"
import { type APIRequestContext, expect, test } from "@playwright/test"
import {
  createSeedRequest,
  seedClothingItem,
  seedClothingLocation,
  seedClothingType,
} from "../api/seeding"
import { InventoryReconciliationPage } from "../pages/InventoryReconciliationPage"
import { PoolKlamottenPage } from "../pages/PoolKlamottenPage"

test.use({ storageState: "playwright/.auth/kleiderwart.json" })

test.describe("Inventarisierung (Inventory Reconciliation)", () => {
  let api: APIRequestContext
  let typeName: string
  let barcodeAtLocation: string
  let barcodeElsewhere: string
  let locationName: string
  let otherLocationName: string

  test.beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8)
    typeName = `Typ-Inv-${suffix}`
    barcodeAtLocation = `BC-INV-A-${suffix}`
    barcodeElsewhere = `BC-INV-B-${suffix}`
    locationName = `Pool-Inv-${suffix}`
    otherLocationName = `Other-Inv-${suffix}`

    api = await createSeedRequest()
    const type = await seedClothingType(api, typeName)
    const location = await seedClothingLocation(api, {
      name: locationName,
      type: "POOL",
    })
    const otherLocation = await seedClothingLocation(api, {
      name: otherLocationName,
      type: "OTHER",
    })
    await seedClothingItem(api, {
      typeId: type.id,
      size: "L",
      barcode: barcodeAtLocation,
      locationId: location.id,
    })
    await seedClothingItem(api, {
      typeId: type.id,
      size: "XL",
      barcode: barcodeElsewhere,
      locationId: otherLocation.id,
    })
  })

  test.afterAll(async () => {
    await api.dispose()
  })

  test("completes the full inventory reconciliation flow", async ({ page }) => {
    const reconciliationPage = new InventoryReconciliationPage(page)
    const poolPage = new PoolKlamottenPage(page)

    await reconciliationPage.goto()
    await expect(page.getByText("Schritt 1: Standort wählen")).toBeVisible()
    await reconciliationPage.selectLocation(locationName)

    await expect(page.getByText("Schritt 2: Kleidung scannen")).toBeVisible()
    await reconciliationPage.scanBarcode(barcodeAtLocation)
    await expect(
      reconciliationPage.scannedItem(`${typeName} – L`),
    ).toBeVisible()
    await expect(
      reconciliationPage.scannedItem(`${typeName} – L`).getByText(locationName),
    ).not.toBeVisible()

    await reconciliationPage.scanBarcode(barcodeElsewhere)
    await expect(
      reconciliationPage.scannedItem(`${typeName} – XL`),
    ).toBeVisible()
    await expect(
      reconciliationPage
        .scannedItem(`${typeName} – XL`)
        .getByText(otherLocationName),
    ).toBeVisible()

    await reconciliationPage.clickWeiter()

    await expect(
      page.getByText("Schritt 3: Differenzen & Bestätigen"),
    ).toBeVisible()

    await expect(reconciliationPage.diffSection("Unverändert")).toBeVisible()
    await expect(page.getByText(`${typeName} – L`)).toBeVisible()
    await expect(reconciliationPage.diffSection("Gefunden")).toBeVisible()

    await reconciliationPage.submitReconciliation()

    await expect(reconciliationPage.successHeading()).toBeVisible()

    await reconciliationPage.navigateToOverviewButton().click()
    await expect(page).toHaveURL(/\/pool-clothing/)
    await expect(poolPage.loadingIndicator()).not.toBeVisible()
  })
})
