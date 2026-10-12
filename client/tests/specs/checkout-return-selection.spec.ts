import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createClothingItem } from "../flows/createClothingItem"
import { createClothingLocation } from "../flows/createClothingLocation"
import { createClothingType } from "../flows/createClothingType"
import { CheckoutPage } from "../pages/CheckoutPage"

// The checkout route is guarded to USER role only.
test.use({ storageState: "playwright/.auth/user.json" })

test.describe("Checkout – return selection (regression #323)", () => {
  let scannedTypeName: string
  let scannedBarcode: string
  let lockerWithAutoItem: string
  let washLocationName: string

  test.beforeAll(async ({ browser }) => {
    const suffix = randomUUID().slice(0, 8)
    scannedTypeName = `Typ-Scan-${suffix}`
    scannedBarcode = `BC-SCAN-${suffix}`
    lockerWithAutoItem = `Spind-Auto-${suffix}`
    washLocationName = `Waesche-Desync-${suffix}`

    const page = await browser.newPage({
      storageState: "playwright/.auth/kleiderwart.json",
    })

    await createClothingType(page, scannedTypeName)

    const poolLocationName = `Pool-Desync-${suffix}`
    await createClothingLocation(page, { type: "POOL", name: poolLocationName })
    await createClothingLocation(page, {
      type: "WAESCHE",
      name: washLocationName,
    })

    // Item the user scans at checkout (lives in the pool).
    await createClothingItem(page, {
      typeName: scannedTypeName,
      size: "M",
      barcode: scannedBarcode,
      locationName: poolLocationName,
    })

    await createClothingLocation(page, {
      type: "PERSONAL",
      name: lockerWithAutoItem,
    })

    // Locker item of the scanned type — auto-selected as a return.
    await createClothingItem(page, {
      typeName: scannedTypeName,
      size: "L",
      locationName: lockerWithAutoItem,
    })

    await page.close()
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
