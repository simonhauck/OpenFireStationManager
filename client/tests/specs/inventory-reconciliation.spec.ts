import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createClothingItem } from "../flows/createClothingItem"
import { createClothingLocation } from "../flows/createClothingLocation"
import { createClothingType } from "../flows/createClothingType"
import { InventoryReconciliationPage } from "../pages/InventoryReconciliationPage"
import { PoolKlamottenPage } from "../pages/PoolKlamottenPage"

test.use({ storageState: "playwright/.auth/kleiderwart.json" })

test.describe("Inventarisierung (Inventory Reconciliation)", () => {
  let typeName: string
  let barcodeAtLocation: string
  let barcodeElsewhere: string
  let locationName: string
  let otherLocationName: string

  test.beforeAll(async ({ browser }) => {
    const suffix = randomUUID().slice(0, 8)
    typeName = `Typ-Inv-${suffix}`
    barcodeAtLocation = `BC-INV-A-${suffix}`
    barcodeElsewhere = `BC-INV-B-${suffix}`
    locationName = `Pool-Inv-${suffix}`
    otherLocationName = `Other-Inv-${suffix}`

    const page = await browser.newPage({
      storageState: "playwright/.auth/kleiderwart.json",
    })

    await createClothingType(page, typeName)

    await createClothingLocation(page, {
      type: "POOL",
      name: locationName,
    })
    await createClothingLocation(page, {
      type: "OTHER",
      name: otherLocationName,
    })

    await createClothingItem(page, {
      typeName,
      size: "L",
      barcode: barcodeAtLocation,
      locationName,
    })
    await createClothingItem(page, {
      typeName,
      size: "XL",
      barcode: barcodeElsewhere,
      locationName: otherLocationName,
    })

    await page.close()
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

    await reconciliationPage.scanBarcode(barcodeElsewhere)
    await expect(
      reconciliationPage.scannedItem(`${typeName} – XL`),
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
