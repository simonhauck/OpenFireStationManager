import { randomUUID } from "node:crypto"
import { type APIRequestContext, expect, test } from "@playwright/test"
import {
  createSeedRequest,
  seedClothingItem,
  seedClothingLocation,
  seedClothingType,
} from "../api/seeding"
import { CheckoutPage } from "../pages/CheckoutPage"

// The checkout route is guarded to USER role only.
test.use({ storageState: "playwright/.auth/user.json" })

test.describe("Checkout – return selection (regression #323)", () => {
  let api: APIRequestContext
  let scannedTypeName: string
  let scannedBarcode: string
  let lockerWithAutoItem: string
  let washLocationName: string

  test.beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8)
    scannedTypeName = `Typ-Scan-${suffix}`
    scannedBarcode = `BC-SCAN-${suffix}`
    lockerWithAutoItem = `Spind-Auto-${suffix}`
    washLocationName = `Waesche-Desync-${suffix}`

    api = await createSeedRequest()
    const type = await seedClothingType(api, scannedTypeName)

    const pool = await seedClothingLocation(api, {
      name: `Pool-Desync-${suffix}`,
      type: "POOL",
    })
    await seedClothingLocation(api, {
      name: washLocationName,
      type: "WAESCHE",
    })

    // Item the user scans at checkout (lives in the pool).
    await seedClothingItem(api, {
      typeId: type.id,
      size: "M",
      barcode: scannedBarcode,
      locationId: pool.id,
    })

    const locker = await seedClothingLocation(api, {
      name: lockerWithAutoItem,
      type: "PERSONAL",
    })
    // Locker item of the scanned type — auto-selected as a return.
    await seedClothingItem(api, {
      typeId: type.id,
      size: "L",
      locationId: locker.id,
    })
  })

  test.afterAll(async () => {
    await api.dispose()
  })

  test("auto-selected return is kept, taken item issued and return routed to the wash step", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(lockerWithAutoItem)
    await checkoutPage.scanBarcode(scannedBarcode)

    // The matching locker item is suggested live, without leaving the step.
    const autoChecked = checkoutPage.rueckgabeCheckbox(`${scannedTypeName} – L`)
    await expect(autoChecked).toBeChecked()

    // A return is selected → wizard goes to the wash step (step 3).
    await checkoutPage.clickWeiter()
    await expect(page.getByText("Schritt 3: Wäsche-Ziel wählen")).toBeVisible()
    await page.getByText(washLocationName, { exact: true }).click()

    await expect(page.getByText("Schritt 4: Überprüfen")).toBeVisible()
    await expect(page.getByText(`${scannedTypeName} – L`)).toBeVisible()
  })
})
