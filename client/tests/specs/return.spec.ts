import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createClothingItem } from "../flows/createClothingItem"
import { createClothingLocation } from "../flows/createClothingLocation"
import { createClothingType } from "../flows/createClothingType"
import { PoolKlamottenPage } from "../pages/PoolKlamottenPage"
import { ReturnPage } from "../pages/ReturnPage"

test.use({ storageState: "playwright/.auth/user.json" })

// ─── Tracer bullet: page load + title ──────────────────────────────────────

test("shows correct title for WAESCHE return target", async ({ page }) => {
  const returnPage = new ReturnPage(page)
  await returnPage.goto("WAESCHE")

  await expect(returnPage.pageTitle()).toHaveText(
    "Klamotten in die Wäsche geben",
  )
})

test("cancel button navigates back to pool overview", async ({ page }) => {
  const returnPage = new ReturnPage(page)
  await returnPage.goto("WAESCHE")

  await returnPage.cancelButton().click()
  await page.waitForURL("**/pool-clothing")
})

// ─── Full scanner flow: return to WAESCHE ───────────────────────────────────

let typeName: string
let barcode: string
let personalLocationName: string
let waescheLocationName: string

test.beforeAll(async ({ browser }) => {
  const kleiderwartPage = await browser.newPage({
    storageState: "playwright/.auth/kleiderwart.json",
  })
  const suffix = randomUUID().slice(0, 8)
  typeName = `Typ-Return-${suffix}`
  barcode = `BC-RT-${suffix}`
  personalLocationName = `Spind-${suffix}`
  waescheLocationName = `Waesche-${suffix}`

  await createClothingType(kleiderwartPage, typeName)
  await createClothingLocation(kleiderwartPage, {
    type: "PERSONAL",
    name: personalLocationName,
  })
  await createClothingLocation(kleiderwartPage, {
    type: "WAESCHE",
    name: waescheLocationName,
  })
  await createClothingItem(kleiderwartPage, {
    typeName,
    size: "M",
    barcode,
    locationName: personalLocationName,
  })
  await kleiderwartPage.close()
})

test("scanner flow: return item to WAESCHE via barcode scan", async ({
  page,
}) => {
  const returnPage = new ReturnPage(page)
  await returnPage.goto("WAESCHE")

  // Wait for scanner to be ready
  await expect(page.getByText("Scanner bereit – einfach scannen")).toBeVisible()

  // Step 1: scan barcode
  await returnPage.scanBarcode(barcode)
  await expect(returnPage.scannedItem(`${typeName} – M`)).toBeVisible()

  // Click "Weiter" to step 2
  await returnPage.weiterButton().click()

  // Step 2: pick WAESCHE target
  await returnPage.tileGridItem(waescheLocationName).click()

  // Step 3: review – verify item shown
  await expect(page.getByText(typeName)).toBeVisible()
  await expect(page.getByText(waescheLocationName)).toBeVisible()

  // Submit
  await returnPage.submitButton().click()

  // Step 4: success
  await expect(returnPage.successHeading()).toBeVisible()
})

// ─── PoolKlamottenPage buttons ────────────────────────────────────────────────

test("pool overview shows exchange and return buttons", async ({ page }) => {
  const poolPage = new PoolKlamottenPage(page)
  await poolPage.goto()

  await expect(
    page.getByRole("link", { name: "Klamotten tauschen" }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Klamotten in die Wäsche geben" }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Klamotten zurück in den Pool geben" }),
  ).toBeVisible()
})

test("'Klamotten tauschen' button navigates to checkout", async ({ page }) => {
  const poolPage = new PoolKlamottenPage(page)
  await poolPage.goto()

  await page.getByRole("link", { name: "Klamotten tauschen" }).click()
  await page.waitForURL("**/pool-clothing/checkout")
})

test("'Klamotten in die Wäsche geben' button navigates to return", async ({
  page,
}) => {
  const poolPage = new PoolKlamottenPage(page)
  await poolPage.goto()

  await page
    .getByRole("link", { name: "Klamotten in die Wäsche geben" })
    .click()
  await page.waitForURL("**/pool-clothing/return?returnTarget=WAESCHE**")
})

// ─── POOL return variant ──────────────────────────────────────────────────────

test("return page for POOL target shows pool locations", async ({ page }) => {
  const returnPage = new ReturnPage(page)
  await returnPage.goto("POOL")

  await expect(returnPage.pageTitle()).toHaveText("Klamotten in den Pool geben")
})

// ─── Location dialog flow ─────────────────────────────────────────────────────

test("location dialog: select item from locker, add, proceed to review", async ({
  page,
}) => {
  const returnPage = new ReturnPage(page)
  await returnPage.goto("WAESCHE")

  // Switch to locker tab
  await page.getByRole("button", { name: "Aus Spind auswählen" }).click()

  // Dialog should appear
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()

  // Select the personal location via combobox
  const combobox = dialog.locator('[role="combobox"]')
  await combobox.click()
  await page.keyboard.type(personalLocationName)
  await page.keyboard.press("Enter")

  // Check the item
  const checkbox = dialog.getByRole("checkbox")
  await checkbox.check()

  // Click Hinzufügen
  await dialog.getByRole("button", { name: "Hinzufügen" }).click()

  // Dialog should close, item should be in the list
  await expect(dialog).not.toBeVisible()
  await expect(returnPage.scannedItem(`${typeName} – M`)).toBeVisible()

  // Proceed through the flow
  await returnPage.weiterButton().click()
  await returnPage.tileGridItem(waescheLocationName).click()

  await expect(page.getByText(typeName)).toBeVisible()
  await returnPage.submitButton().click()

  await expect(returnPage.successHeading()).toBeVisible()
})
