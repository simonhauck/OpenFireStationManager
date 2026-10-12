import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createClothingItem } from "../flows/createClothingItem"
import { createClothingLocation } from "../flows/createClothingLocation"
import { createClothingType } from "../flows/createClothingType"
import { CheckoutPage } from "../pages/CheckoutPage"
import { PoolKlamottenPage } from "../pages/PoolKlamottenPage"

// The checkout route is guarded to USER role only.
test.use({ storageState: "playwright/.auth/user.json" })

test.describe("Checkout", () => {
  let typeName: string
  let barcode: string
  let personalLocationName: string
  let poolLocationName: string

  test.beforeAll(async ({ browser }) => {
    const suffix = randomUUID().slice(0, 8)
    typeName = `Typ-Checkout-${suffix}`
    barcode = `BC-CO-${suffix}`
    personalLocationName = `Spind-${suffix}`
    poolLocationName = `Pool-${suffix}`

    // Setup requires KLEIDERWART role — use a dedicated page for preconditions.
    const page = await browser.newPage({
      storageState: "playwright/.auth/kleiderwart.json",
    })

    await createClothingType(page, typeName)
    await createClothingLocation(page, { type: "POOL", name: poolLocationName })
    await createClothingItem(page, {
      typeName,
      size: "M",
      barcode,
      locationName: poolLocationName,
    })
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
    // The pool item is auto-sorted into the Ausgabe column
    await expect(checkoutPage.ausgabeRow(`${typeName} – M`)).toBeVisible()

    // No returns → the wash step is skipped and the wizard lands on review
    // (step 4).
    await checkoutPage.clickWeiter()

    // ── Step 4: Review and submit ─────────────────────────────────────────────
    await expect(page.getByText("Schritt 4: Überprüfen")).toBeVisible()
    await expect(page.getByText(`${typeName} – M`)).toBeVisible()
    await checkoutPage.submitCheckout()

    // ── Step 5: Success screen ────────────────────────────────────────────────
    await expect(checkoutPage.successHeading()).toBeVisible()

    await checkoutPage.navigateToOverviewButton().click()
    await expect(page).toHaveURL(/\/pool-clothing/)

    // ── Verify item is no longer in the pool ─────────────────────────────────
    const typePanelHeader = poolPage.typePanel(poolLocationName, typeName)
    await expect(typePanelHeader).toBeVisible({ timeout: 10000 })
    await expect(typePanelHeader.getByText("(0)")).toBeVisible({
      timeout: 10000,
    })
  })
})

test.describe("Checkout – items not recorded at the target location", () => {
  let typeName: string
  let barcode: string
  let personalLocationName: string
  let washLocationName: string

  test.beforeAll(async ({ browser }) => {
    const suffix = randomUUID().slice(0, 8)
    typeName = `Typ-Disc-${suffix}`
    barcode = `BC-DC-${suffix}`
    personalLocationName = `Spind-Disc-${suffix}`
    washLocationName = `Waesche-Disc-${suffix}`

    const page = await browser.newPage({
      storageState: "playwright/.auth/kleiderwart.json",
    })

    await createClothingType(page, typeName)

    // Item lives at a WAESCHE location — deliberately not a POOL location
    await createClothingLocation(page, {
      type: "WAESCHE",
      name: washLocationName,
    })
    await createClothingItem(page, {
      typeName,
      size: "L",
      barcode,
      locationName: washLocationName,
    })

    await createClothingLocation(page, {
      type: "PERSONAL",
      name: personalLocationName,
    })

    await page.close()
  })

  test("scanned item is put into Ausgabe with its recorded location shown inline", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(personalLocationName)

    await checkoutPage.scanBarcode(barcode)

    const row = checkoutPage.ausgabeRow(`${typeName} – L`)
    await expect(row).toBeVisible()
    await expect(row).toContainText(washLocationName)
  })
})
