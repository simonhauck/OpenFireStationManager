import { expect, test } from "@playwright/test"
import { randomUUID } from "node:crypto"
import { createClothingType } from "../flows/createClothingType"
import { createClothingLocation } from "../flows/createClothingLocation"
import { createClothingItem } from "../flows/createClothingItem"
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

  test("button is visible on Pool Klamotten for Kleiderwart", async ({
    page,
  }) => {
    const poolPage = new PoolKlamottenPage(page)
    await poolPage.goto()

    await expect(
      page.getByRole("link", { name: "Inventarisierung starten" }),
    ).toBeVisible()
  })

  test("completes the full inventory reconciliation flow", async ({ page }) => {
    const reconciliationPage = new InventoryReconciliationPage(page)
    const poolPage = new PoolKlamottenPage(page)

    // ── Step 1: Navigate and select location ────────────────────────────────
    await reconciliationPage.goto()
    await expect(page.getByText("Schritt 1: Standort wählen")).toBeVisible()
    await reconciliationPage.selectLocation(locationName)

    // ── Step 2: Scan items ─────────────────────────────────────────────────
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

    // ── Step 3: Diff & Confirm ─────────────────────────────────────────────
    await expect(
      page.getByText("Schritt 3: Differenzen & Bestätigen"),
    ).toBeVisible()

    // Unchanged section: item scanned at the correct location
    await expect(reconciliationPage.diffSection("Unverändert")).toBeVisible()
    await expect(page.getByText(`${typeName} – L`)).toBeVisible()

    // Found section: item scanned but not at location
    await expect(reconciliationPage.diffSection("Gefunden")).toBeVisible()
    // XL item should appear in the found section

    // Missing section: items at location but not scanned
    // (none expected — we scanned the only item at this location)

    // Confirm
    await reconciliationPage.submitReconciliation()

    // ── Step 4: Success ────────────────────────────────────────────────────
    await expect(reconciliationPage.successHeading()).toBeVisible()

    // Navigate to pool overview
    await reconciliationPage.navigateToOverviewButton().click()
    await expect(page).toHaveURL(/\/pool-clothing/)
    await expect(poolPage.loadingIndicator()).not.toBeVisible()
  })
})
