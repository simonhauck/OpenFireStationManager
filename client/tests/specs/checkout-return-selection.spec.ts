import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createClothingItem } from "../flows/createClothingItem"
import { createClothingLocation } from "../flows/createClothingLocation"
import { createClothingType } from "../flows/createClothingType"
import { CheckoutPage } from "../pages/CheckoutPage"

// The checkout route is guarded to USER role only.
test.use({ storageState: "playwright/.auth/user.json" })

// Serial mode: all tests share the beforeAll fixtures below.
test.describe.configure({ mode: "serial" })

test.describe("Checkout – return selection (regression #323)", () => {
  let scannedTypeName: string
  let lockerOnlyTypeName: string
  let scannedBarcode: string
  let otherTypeBarcode: string
  let lockerWithAutoItem: string
  let lockerWithoutAutoItem: string
  let washLocationName: string

  test.beforeAll(async ({ browser }) => {
    const suffix = randomUUID().slice(0, 8)
    scannedTypeName = `Typ-Scan-${suffix}`
    lockerOnlyTypeName = `Typ-Locker-${suffix}`
    scannedBarcode = `BC-SCAN-${suffix}`
    otherTypeBarcode = `BC-OTHER-${suffix}`
    lockerWithAutoItem = `Spind-Auto-${suffix}`
    lockerWithoutAutoItem = `Spind-NoAuto-${suffix}`
    washLocationName = `Waesche-Desync-${suffix}`

    const page = await browser.newPage({
      storageState: "playwright/.auth/kleiderwart.json",
    })

    await createClothingType(page, scannedTypeName)
    await createClothingType(page, lockerOnlyTypeName)

    const poolLocationName = `Pool-Desync-${suffix}`
    await createClothingLocation(page, { type: "POOL", name: poolLocationName })
    await createClothingLocation(page, {
      type: "WAESCHE",
      name: washLocationName,
    })

    // Item that the user scans at checkout (lives in the pool).
    await createClothingItem(page, {
      typeName: scannedTypeName,
      size: "M",
      barcode: scannedBarcode,
      locationName: poolLocationName,
    })
    // Second pool item of a different type, used to drop a take again.
    await createClothingItem(page, {
      typeName: lockerOnlyTypeName,
      size: "S",
      barcode: otherTypeBarcode,
      locationName: poolLocationName,
    })

    await createClothingLocation(page, {
      type: "PERSONAL",
      name: lockerWithAutoItem,
    })
    await createClothingLocation(page, {
      type: "PERSONAL",
      name: lockerWithoutAutoItem,
    })

    // Locker A: item of the scanned type (auto-selected) + item of another type.
    await createClothingItem(page, {
      typeName: scannedTypeName,
      size: "L",
      locationName: lockerWithAutoItem,
    })
    await createClothingItem(page, {
      typeName: lockerOnlyTypeName,
      size: "XL",
      locationName: lockerWithAutoItem,
    })

    // Locker B: only an item of another type (never auto-selected).
    await createClothingItem(page, {
      typeName: lockerOnlyTypeName,
      size: "XXL",
      locationName: lockerWithoutAutoItem,
    })

    await page.close()
  })

  test("auto-selected return is kept when the user continues without touching it", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(lockerWithAutoItem)
    await checkoutPage.scanBarcode(scannedBarcode)
    await checkoutPage.clickWeiter()

    const autoChecked = page.getByRole("checkbox", {
      name: `${scannedTypeName} – L`,
    })
    await expect(autoChecked).toBeChecked()

    // A return is selected → wizard goes to step 4 (wash location).
    await checkoutPage.confirmReturns()
    await expect(page.getByText("Schritt 4: Wäsche-Ziel wählen")).toBeVisible()
    await page.getByText(washLocationName, { exact: true }).click()

    await expect(page.getByText("Schritt 5: Überprüfen")).toBeVisible()
    await expect(page.getByText(`${scannedTypeName} – L`)).toBeVisible()
  })

  test("manual deselection of an auto-selected item survives navigating back", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(lockerWithAutoItem)
    await checkoutPage.scanBarcode(scannedBarcode)
    await checkoutPage.clickWeiter()

    const autoChecked = page.getByRole("checkbox", {
      name: `${scannedTypeName} – L`,
    })
    await expect(autoChecked).toBeChecked()

    // User does not want to return the trouser → uncheck it.
    await autoChecked.click()
    await expect(autoChecked).not.toBeChecked()

    // User goes back to step 2 (e.g. to scan another item) and forward again.
    await page.getByRole("button", { name: "← Zurück" }).click()
    await expect(page.getByText("Schritt 2: Kleidung scannen")).toBeVisible()
    await checkoutPage.clickWeiter()
    await expect(page.getByText("Schritt 3: Rückgabe wählen")).toBeVisible()

    // Step 3 remounted: the auto-toggle must not re-check the item.
    await expect(autoChecked).not.toBeChecked()
  })

  test("manual selection of a non-auto-selected item survives navigating back", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(lockerWithoutAutoItem)
    await checkoutPage.scanBarcode(scannedBarcode)
    await checkoutPage.clickWeiter()

    const manuallyChecked = page.getByRole("checkbox", {
      name: `${lockerOnlyTypeName} – XXL`,
    })
    await expect(manuallyChecked).not.toBeChecked()

    // User wants to return the item (no type match → not auto-selected).
    await manuallyChecked.click()
    await expect(manuallyChecked).toBeChecked()

    // User goes back to step 2 and forward again.
    await page.getByRole("button", { name: "← Zurück" }).click()
    await expect(page.getByText("Schritt 2: Kleidung scannen")).toBeVisible()
    await checkoutPage.clickWeiter()
    await expect(page.getByText("Schritt 3: Rückgabe wählen")).toBeVisible()

    // Step 3 remounted: the empty auto-toggle result must not wipe the
    // manual selection.
    await expect(manuallyChecked).toBeChecked()
  })

  test("dropping a taken item also drops its return suggestion", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(lockerWithAutoItem)
    await checkoutPage.scanBarcode(scannedBarcode)
    await expect(
      checkoutPage.scannedItem(`${scannedTypeName} – M`),
    ).toBeVisible()
    await checkoutPage.scanBarcode(otherTypeBarcode)
    await expect(
      checkoutPage.scannedItem(`${lockerOnlyTypeName} – S`),
    ).toBeVisible()
    await checkoutPage.clickWeiter()

    const suggestedItem = page.getByRole("checkbox", {
      name: `${scannedTypeName} – L`,
    })
    const otherSuggestedItem = page.getByRole("checkbox", {
      name: `${lockerOnlyTypeName} – XL`,
    })
    await expect(suggestedItem).toBeChecked()
    await expect(otherSuggestedItem).toBeChecked()

    // User removes one of the taken items again and re-enters step 3.
    await page.getByRole("button", { name: "← Zurück" }).click()
    await page
      .getByRole("button", { name: `${scannedTypeName} entfernen` })
      .click()
    await checkoutPage.clickWeiter()
    await expect(page.getByText("Schritt 3: Rückgabe wählen")).toBeVisible()

    // Its suggestion is gone, the other suggestion (and take) stays.
    await expect(suggestedItem).not.toBeChecked()
    await expect(otherSuggestedItem).toBeChecked()
  })
})
