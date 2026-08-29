import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createClothingItem } from "../flows/createClothingItem"
import { createClothingLocation } from "../flows/createClothingLocation"
import { createClothingType } from "../flows/createClothingType"
import { PoolKlamottenPage } from "../pages/PoolKlamottenPage"
import { RelocationPage } from "../pages/RelocationPage"

// Relocation is guarded to KLEIDERWART role.
test.use({ storageState: "playwright/.auth/kleiderwart.json" })

test.describe("Umlagerung (Relocation)", () => {
  let typeName: string
  let barcode1: string
  let barcode2: string
  let sourceLocationName: string
  let targetLocationName: string

  test.beforeAll(async ({ browser }) => {
    const suffix = randomUUID().slice(0, 8)
    typeName = `Typ-Relocation-${suffix}`
    barcode1 = `BC-REL-A-${suffix}`
    barcode2 = `BC-REL-B-${suffix}`
    sourceLocationName = `Pool-Src-${suffix}`
    targetLocationName = `Pool-Target-${suffix}`

    const page = await browser.newPage({
      storageState: "playwright/.auth/kleiderwart.json",
    })

    // 1. Create a clothing type
    await createClothingType(page, typeName)

    // 2. Create a source POOL location
    await createClothingLocation(page, {
      type: "POOL",
      name: sourceLocationName,
    })

    // 3. Create two clothing items in the source location
    await createClothingItem(page, {
      typeName,
      size: "L",
      barcode: barcode1,
      locationName: sourceLocationName,
    })
    await createClothingItem(page, {
      typeName,
      size: "XL",
      barcode: barcode2,
      locationName: sourceLocationName,
    })

    // 4. Create a target POOL location
    await createClothingLocation(page, {
      type: "POOL",
      name: targetLocationName,
    })

    await page.close()
  })

  test("Umlagerung starten button is visible on Pool Klamotten for Kleiderwart", async ({
    page,
  }) => {
    const poolPage = new PoolKlamottenPage(page)
    await poolPage.goto()

    await expect(
      page.getByRole("link", { name: "Umlagerung starten" }),
    ).toBeVisible()
  })

  test("completes the full relocation flow and items are moved to target", async ({
    page,
  }) => {
    const relocationPage = new RelocationPage(page)
    const poolPage = new PoolKlamottenPage(page)

    // ── Step 1: Navigate and select target location ───────────────────────────
    await relocationPage.goto()
    await expect(page.getByText("Schritt 1: Ziel wählen")).toBeVisible()
    await relocationPage.selectTargetLocation(targetLocationName)

    // ── Step 2: Scan two items ────────────────────────────────────────────────
    await expect(page.getByText("Schritt 2: Kleidung scannen")).toBeVisible()
    await relocationPage.scanBarcode(barcode1)
    await expect(relocationPage.scannedItem(`${typeName} – L`)).toBeVisible()

    await relocationPage.scanBarcode(barcode2)
    await expect(relocationPage.scannedItem(`${typeName} – XL`)).toBeVisible()

    await relocationPage.clickWeiter()

    // ── Step 3: Review ────────────────────────────────────────────────────────
    await expect(page.getByText("Schritt 3: Überprüfen")).toBeVisible()
    await expect(page.getByText(targetLocationName)).toBeVisible()
    await expect(page.getByText(`${typeName} – L`)).toBeVisible()
    await expect(page.getByText(`${typeName} – XL`)).toBeVisible()
    await relocationPage.submitRelocation()

    // ── Step 4: Success screen ────────────────────────────────────────────────
    await expect(relocationPage.successHeading()).toBeVisible()
    await expect(page.getByText(targetLocationName)).toBeVisible()

    // Navigate to pool overview
    await relocationPage.navigateToOverviewButton().click()
    await expect(page).toHaveURL(/\/pool-clothing/)
    await expect(poolPage.loadingIndicator()).not.toBeVisible()
  })
})
