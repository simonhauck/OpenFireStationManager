import { randomUUID } from "node:crypto"
import { type APIRequestContext, expect, test } from "@playwright/test"
import {
  createSeedRequest,
  seedClothingItem,
  seedClothingLocation,
  seedClothingType,
} from "../api/seeding"
import { ReturnPage } from "../pages/ReturnPage"

test.use({ storageState: "playwright/.auth/user.json" })

let api: APIRequestContext
let typeName: string
let barcode: string
let personalLocationName: string
let waescheLocationName: string

test.beforeAll(async () => {
  const suffix = randomUUID().slice(0, 8)
  typeName = `Typ-Return-${suffix}`
  barcode = `BC-RT-${suffix}`
  personalLocationName = `Spind-${suffix}`
  waescheLocationName = `Waesche-${suffix}`

  api = await createSeedRequest()
  const type = await seedClothingType(api, typeName)
  const personal = await seedClothingLocation(api, {
    name: personalLocationName,
    type: "PERSONAL",
  })
  await seedClothingLocation(api, {
    name: waescheLocationName,
    type: "WAESCHE",
  })
  await seedClothingItem(api, {
    typeId: type.id,
    size: "M",
    barcode,
    locationId: personal.id,
  })
})

test.afterAll(async () => {
  await api.dispose()
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
