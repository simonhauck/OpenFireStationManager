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
  let lockerItemBarcode: string
  let lockerWithAutoItem: string
  let lockerWithoutAutoItem: string
  let washLocationName: string

  test.beforeAll(async ({ browser }) => {
    const suffix = randomUUID().slice(0, 8)
    scannedTypeName = `Typ-Scan-${suffix}`
    lockerOnlyTypeName = `Typ-Locker-${suffix}`
    scannedBarcode = `BC-SCAN-${suffix}`
    otherTypeBarcode = `BC-OTHER-${suffix}`
    lockerItemBarcode = `BC-RET-${suffix}`
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
      barcode: lockerItemBarcode,
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

  test("scanning a locker item selects it for return", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(lockerWithAutoItem)
    await checkoutPage.scanBarcode(lockerItemBarcode)

    const checkbox = checkoutPage.rueckgabeCheckbox(`${scannedTypeName} – L`)
    await expect(checkbox).toBeChecked()
    // It is a return, not a take.
    await expect(checkoutPage.ausgabeColumn()).not.toContainText(
      `${scannedTypeName} – L`,
    )
  })

  test("manual deselection of an auto-selected item survives navigating away and back", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(lockerWithAutoItem)
    await checkoutPage.scanBarcode(scannedBarcode)

    const autoChecked = checkoutPage.rueckgabeCheckbox(`${scannedTypeName} – L`)
    await expect(autoChecked).toBeChecked()

    // User does not want to return the trouser → uncheck it.
    await autoChecked.click()
    await expect(autoChecked).not.toBeChecked()

    // No returns left → Weiter goes straight to review (step 4).
    await checkoutPage.clickWeiter()
    await expect(page.getByText("Schritt 4: Überprüfen")).toBeVisible()

    // Back to the swap step: the remount must not re-check the item.
    await page.getByRole("button", { name: "← Zurück" }).click()
    await expect(page.getByText("Schritt 2: Kleidung scannen")).toBeVisible()
    await expect(autoChecked).not.toBeChecked()
  })

  test("manual selection of a non-auto-selected item survives navigating away and back", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(lockerWithoutAutoItem)
    await checkoutPage.scanBarcode(scannedBarcode)

    const manuallyChecked = checkoutPage.rueckgabeCheckbox(
      `${lockerOnlyTypeName} – XXL`,
    )
    await expect(manuallyChecked).not.toBeChecked()

    // User wants to return the item (no type match → not auto-selected).
    await manuallyChecked.click()
    await expect(manuallyChecked).toBeChecked()

    // A return is selected → wash step (step 3). The wash step has no back
    // button, so return to the swap step via the stepper.
    await checkoutPage.clickWeiter()
    await expect(page.getByText("Schritt 3: Wäsche-Ziel wählen")).toBeVisible()
    await page
      .getByRole("button", { name: /Zu Schritt 2: Kleidung scannen/ })
      .click()
    await expect(page.getByText("Schritt 2: Kleidung scannen")).toBeVisible()

    // The empty auto-toggle result must not wipe the manual selection.
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
      checkoutPage.ausgabeRow(`${scannedTypeName} – M`),
    ).toBeVisible()
    await checkoutPage.scanBarcode(otherTypeBarcode)
    await expect(
      checkoutPage.ausgabeRow(`${lockerOnlyTypeName} – S`),
    ).toBeVisible()

    const suggestedItem = checkoutPage.rueckgabeCheckbox(
      `${scannedTypeName} – L`,
    )
    const otherSuggestedItem = checkoutPage.rueckgabeCheckbox(
      `${lockerOnlyTypeName} – XL`,
    )
    await expect(suggestedItem).toBeChecked()
    await expect(otherSuggestedItem).toBeChecked()

    // User removes one of the taken items again: its suggestion drops live.
    await checkoutPage.removeTake(scannedTypeName)
    await expect(
      checkoutPage.ausgabeRow(`${scannedTypeName} – M`),
    ).not.toBeVisible()
    await expect(suggestedItem).not.toBeChecked()
    await expect(otherSuggestedItem).toBeChecked()
  })

  test("a return can be selected and continued without any take", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(lockerWithoutAutoItem)

    const checkbox = checkoutPage.rueckgabeCheckbox(
      `${lockerOnlyTypeName} – XXL`,
    )
    await checkbox.click()
    await expect(checkbox).toBeChecked()

    // No takes, but a return → Weiter is enabled and leads to the wash step.
    await checkoutPage.clickWeiter()
    await expect(page.getByText("Schritt 3: Wäsche-Ziel wählen")).toBeVisible()
  })
})
