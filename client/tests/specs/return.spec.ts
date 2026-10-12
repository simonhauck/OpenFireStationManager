import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createClothingItem } from "../flows/createClothingItem"
import { createClothingLocation } from "../flows/createClothingLocation"
import { createClothingType } from "../flows/createClothingType"
import { ReturnPage } from "../pages/ReturnPage"

test.use({ storageState: "playwright/.auth/user.json" })

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

  await expect(page.getByText("Scanner bereit – einfach scannen")).toBeVisible()

  await returnPage.scanBarcode(barcode)
  await expect(returnPage.scannedItem(`${typeName} – M`)).toBeVisible()

  await returnPage.weiterButton().click()

  await returnPage.tileGridItem(waescheLocationName).click()

  await expect(page.getByText(typeName)).toBeVisible()
  await expect(page.getByText(waescheLocationName)).toBeVisible()

  await returnPage.submitButton().click()

  await expect(returnPage.successHeading()).toBeVisible()
})

test("location dialog: select item from locker, add, proceed to review", async ({
  page,
}) => {
  const returnPage = new ReturnPage(page)
  await returnPage.goto("WAESCHE")

  // Switch to locker tab
  await page.getByRole("button", { name: "Aus Spind auswählen" }).click()

  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()

  // Select the personal location via the Spind selector
  const combobox = dialog.getByRole("button", { name: "Spind", exact: true })
  await combobox.click()
  await page.getByPlaceholder("Spind suchen...").fill(personalLocationName)
  await dialog.getByRole("option", { name: personalLocationName }).click()

  const checkbox = dialog.getByRole("checkbox")
  await checkbox.check()

  await dialog.getByRole("button", { name: "Hinzufügen" }).click()

  await expect(dialog).not.toBeVisible()
  await expect(returnPage.scannedItem(`${typeName} – M`)).toBeVisible()

  await returnPage.weiterButton().click()
  await returnPage.tileGridItem(waescheLocationName).click()

  await expect(page.getByText(typeName)).toBeVisible()
  await returnPage.submitButton().click()

  await expect(returnPage.successHeading()).toBeVisible()
})
