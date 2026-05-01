import { expect, test } from "@playwright/test"
import { randomUUID } from "node:crypto"
import { createClothingType } from "../flows/createClothingType"
import { createClothingLocation } from "../flows/createClothingLocation"
import { createClothingItem } from "../flows/createClothingItem"
import { CheckoutPage } from "../pages/CheckoutPage"
import { PoolKlamottenPage } from "../pages/PoolKlamottenPage"

// The checkout route is guarded to USER role only.
test.use({ storageState: "playwright/.auth/user.json" })

test.describe("Checkout", () => {
  let typeName: string
  let barcode: string
  let personalLocationName: string

  test.beforeAll(async ({ browser }) => {
    const suffix = randomUUID().slice(0, 8)
    typeName = `Typ-Checkout-${suffix}`
    barcode = `BC-CO-${suffix}`
    personalLocationName = `Spind-${suffix}`

    // Setup requires KLEIDERWART role — use a dedicated page for preconditions.
    const page = await browser.newPage({
      storageState: "playwright/.auth/kleiderwart.json",
    })

    // 1. Create a clothing type
    await createClothingType(page, typeName)

    // 2. Create a POOL location so the item lives there initially
    const poolLocationName = `Pool-${suffix}`
    await createClothingLocation(page, { type: "POOL", name: poolLocationName })

    // 3. Create the clothing item and place it in the pool location so it
    //    appears in the pool dashboard and can be checked out.
    await createClothingItem(page, {
      typeName,
      size: "M",
      barcode,
      locationName: poolLocationName,
    })

    // 4. Create a PERSONAL location (locker) to check out to
    await createClothingLocation(page, {
      type: "PERSONAL",
      name: personalLocationName,
    })

    await page.close()
  })

  test("completes the full checkout and item is no longer shown in the pool", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)
    const poolPage = new PoolKlamottenPage(page)

    // ── Step 1: Navigate to checkout and select a personal locker ─────────────
    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(personalLocationName)

    // ── Step 2: Scan the clothing item by barcode ─────────────────────────────
    await checkoutPage.scanBarcode(barcode)
    // Verify the item appears in the list before proceeding
    await expect(checkoutPage.scannedItem(`${typeName} – M`)).toBeVisible()
    await checkoutPage.clickWeiter()

    // ── Step 3: Return selection — locker is empty, just continue ─────────────
    await expect(
      page.getByText("Schritt 3: Rückgabe wählen"),
    ).toBeVisible()
    await checkoutPage.confirmReturns()

    // Step 4 (Wäsche-Ziel) is skipped when no returns are selected; we land
    // directly on step 5.

    // ── Step 5: Review and submit ─────────────────────────────────────────────
    await expect(page.getByText("Schritt 5: Überprüfen")).toBeVisible()
    // The item under test should appear in the "Ausgabe" section
    await expect(page.getByText(`${typeName} – M`)).toBeVisible()
    await checkoutPage.submitCheckout()

    // ── Step 6: Success screen ────────────────────────────────────────────────
    await expect(checkoutPage.successHeading()).toBeVisible()

    // Navigate to pool overview
    await checkoutPage.navigateToOverviewButton().click()
    await expect(page).toHaveURL(/\/pool-klamotten/)

    // ── Verify item is no longer in the pool ─────────────────────────────────
    await expect(poolPage.loadingIndicator()).not.toBeVisible()
    // The item was the only item of this type/size; the type badge must be gone.
    await expect(page.getByText(typeName)).not.toBeVisible()
  })
})
