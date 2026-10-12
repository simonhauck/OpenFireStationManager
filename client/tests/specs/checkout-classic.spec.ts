import { randomUUID } from "node:crypto"
import { type APIRequestContext, expect, test } from "@playwright/test"
import {
  createSeedRequest,
  seedClothingItem,
  seedClothingLocation,
  seedClothingType,
} from "../api/seeding"
import { ClassicCheckoutPage } from "../pages/ClassicCheckoutPage"
import { PoolKlamottenPage } from "../pages/PoolKlamottenPage"

// The checkout route is guarded to USER role only.
test.use({ storageState: "playwright/.auth/user.json" })

test.describe("Checkout (klassisch)", () => {
  let api: APIRequestContext
  let typeName: string
  let barcode: string
  let personalLocationName: string
  let poolLocationName: string

  test.beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8)
    typeName = `Typ-Checkout-${suffix}`
    barcode = `BC-CO-${suffix}`
    personalLocationName = `Spind-${suffix}`
    poolLocationName = `Pool-${suffix}`

    api = await createSeedRequest()
    const type = await seedClothingType(api, typeName)
    const pool = await seedClothingLocation(api, {
      name: poolLocationName,
      type: "POOL",
    })
    await seedClothingItem(api, {
      typeId: type.id,
      size: "M",
      barcode,
      locationId: pool.id,
    })
    await seedClothingLocation(api, {
      name: personalLocationName,
      type: "PERSONAL",
    })
  })

  test.afterAll(async () => {
    await api.dispose()
  })

  test("completes the full checkout and item is no longer shown in the pool", async ({
    page,
  }) => {
    const checkoutPage = new ClassicCheckoutPage(page)
    const poolPage = new PoolKlamottenPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(personalLocationName)

    await checkoutPage.scanBarcode(barcode)
    await expect(checkoutPage.scannedItem(`${typeName} – M`)).toBeVisible()
    await checkoutPage.clickWeiter()

    // ── Step 3: Return selection — locker is empty, just continue ─────────────
    await expect(page.getByText("Schritt 3: Rückgabe wählen")).toBeVisible()
    await checkoutPage.confirmReturns()

    // Step 4 (Wäsche-Ziel) is skipped when no returns are selected.
    await expect(page.getByText("Schritt 5: Überprüfen")).toBeVisible()
    await expect(page.getByText(`${typeName} – M`)).toBeVisible()
    await checkoutPage.submitCheckout()

    await expect(checkoutPage.successHeading()).toBeVisible()

    await checkoutPage.navigateToOverviewButton().click()
    await expect(page).toHaveURL(/\/pool-clothing/)

    const typePanelHeader = poolPage.typePanel(poolLocationName, typeName)
    await expect(typePanelHeader).toBeVisible({ timeout: 10000 })
    await expect(typePanelHeader.getByText("(0)")).toBeVisible({
      timeout: 10000,
    })
  })
})

test.describe("Checkout (klassisch) – discrepancy dialog", () => {
  let api: APIRequestContext
  let typeName: string
  let barcode: string
  let personalLocationName: string
  let nonPoolLocationName: string

  test.beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8)
    typeName = `Typ-Disc-${suffix}`
    barcode = `BC-DC-${suffix}`
    personalLocationName = `Spind-Disc-${suffix}`
    nonPoolLocationName = `Waesche-Disc-${suffix}`

    api = await createSeedRequest()
    const type = await seedClothingType(api, typeName)
    // Item lives at a WAESCHE location — deliberately not a POOL location.
    const nonPool = await seedClothingLocation(api, {
      name: nonPoolLocationName,
      type: "WAESCHE",
    })
    await seedClothingItem(api, {
      typeId: type.id,
      size: "L",
      barcode,
      locationId: nonPool.id,
    })
    await seedClothingLocation(api, {
      name: personalLocationName,
      type: "PERSONAL",
    })
  })

  test.afterAll(async () => {
    await api.dispose()
  })

  test("shows discrepancy dialog when scanned item is not at a POOL location", async ({
    page,
  }) => {
    const checkoutPage = new ClassicCheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(personalLocationName)

    await checkoutPage.scanBarcode(barcode)

    await expect(checkoutPage.discrepancyDialog()).toBeVisible()
    await expect(checkoutPage.discrepancyDialog()).toContainText(
      nonPoolLocationName,
    )
  })
})
