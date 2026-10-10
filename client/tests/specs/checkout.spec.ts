import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createClothingItem } from "../flows/createClothingItem"
import { createClothingLocation } from "../flows/createClothingLocation"
import { createClothingType } from "../flows/createClothingType"
import { createMember } from "../flows/createMember"
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

    // 1. Create a clothing type
    await createClothingType(page, typeName)

    // 2. Create a POOL location so the item lives there initially
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
    // The pool item is auto-sorted into the Ausgabe column
    await expect(checkoutPage.ausgabeRow(`${typeName} – M`)).toBeVisible()

    // No returns → the wash step is skipped and the wizard lands on review
    // (step 4).
    await checkoutPage.clickWeiter()

    // ── Step 4: Review and submit ─────────────────────────────────────────────
    await expect(page.getByText("Schritt 4: Überprüfen")).toBeVisible()
    // The item under test should appear in the "Ausgabe" section
    await expect(page.getByText(`${typeName} – M`)).toBeVisible()
    await checkoutPage.submitCheckout()

    // ── Step 5: Success screen ────────────────────────────────────────────────
    await expect(checkoutPage.successHeading()).toBeVisible()

    // Navigate to pool overview
    await checkoutPage.navigateToOverviewButton().click()
    await expect(page).toHaveURL(/\/pool-clothing/)

    // ── Verify item is no longer in the pool ─────────────────────────────────
    // The pool overview retains zero-count type panels, so we assert the count
    // dropped to 0 rather than the panel disappearing entirely.
    // Scope to the specific pool location section (via data-testid) to avoid
    // false matches from other pool locations in the shared database.
    const typePanelHeader = poolPage.typePanel(poolLocationName, typeName)
    await expect(typePanelHeader).toBeVisible({ timeout: 10000 })
    await expect(typePanelHeader.getByText("(0)")).toBeVisible({
      timeout: 10000,
    })
  })
})

test.describe("Checkout – owner names", () => {
  let memberName: string
  let personalLocationName: string

  test.beforeAll(async ({ browser }) => {
    const suffix = randomUUID().slice(0, 8)
    memberName = `Mitglied-${suffix}`
    personalLocationName = `Spind-Owner-${suffix}`

    const page = await browser.newPage({
      storageState: "playwright/.auth/kleiderwart.json",
    })

    await createMember(page, memberName)
    await createClothingLocation(page, {
      type: "PERSONAL",
      name: personalLocationName,
      memberName,
    })

    await page.close()
  })

  test("shows the owner's name in the Spind picker", async ({ page }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await page.getByRole("button", { name: "Spind", exact: true }).click()
    await page.getByPlaceholder("Spind suchen...").fill(personalLocationName)

    await expect(
      page.getByRole("option", {
        name: `${personalLocationName} – ${memberName}`,
      }),
    ).toBeVisible()
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

  test("the swap action moves the item into the Rückgabe selection", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(personalLocationName)

    await checkoutPage.scanBarcode(barcode)
    await checkoutPage.moveToReturn(`${typeName} – L`)

    await expect(checkoutPage.ausgabeRow(`${typeName} – L`)).not.toBeVisible()
    await expect(checkoutPage.rueckgabeRow(`${typeName} – L`)).toBeVisible()
    await expect(checkoutPage.rueckgabeColumn()).toContainText(washLocationName)
  })

  test("moving a forced return back puts the item into Ausgabe", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(personalLocationName)

    await checkoutPage.scanBarcode(barcode)
    await checkoutPage.moveToReturn(`${typeName} – L`)
    await checkoutPage.moveToAusgabe(`${typeName} – L`)

    await expect(checkoutPage.ausgabeRow(`${typeName} – L`)).toBeVisible()
    await expect(checkoutPage.rueckgabeRow(`${typeName} – L`)).not.toBeVisible()
  })
})
