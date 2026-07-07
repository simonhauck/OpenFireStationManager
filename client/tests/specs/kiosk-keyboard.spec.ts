import { expect, test } from "@playwright/test"
import { randomUUID } from "node:crypto"
import { createClothingType } from "../flows/createClothingType"
import { createClothingLocation } from "../flows/createClothingLocation"
import { createClothingItem } from "../flows/createClothingItem"
import { CheckoutPage } from "../pages/CheckoutPage"

test.use({ storageState: "playwright/.auth/user.json" })

test.describe("Kiosk – on-screen keyboard in checkout", () => {
  let typeName: string
  let barcode: string
  let personalLocationName: string
  let poolLocationName: string

  test.beforeAll(async ({ browser }) => {
    const suffix = randomUUID().slice(0, 8)
    typeName = `Typ-Kiosk-${suffix}`
    barcode = `BC-KI-${suffix}`
    personalLocationName = `Spind-Kiosk-${suffix}`
    poolLocationName = `Pool-Kiosk-${suffix}`

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

  test("enables kiosk, types on the virtual keyboard in the checkout search field", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)

    await page.goto("/")
    await page.evaluate(() => localStorage.setItem("kiosk", "true"))
    await page.reload()

    await checkoutPage.goto()

    await page.getByRole("combobox").click()

    await expect(page.locator("[data-kiosk-keyboard]")).toBeVisible()

    const searchInput = page.getByPlaceholder("Spind suchen...")

    await page.locator('.hg-button[data-skbtn="s"]').click()
    await expect(searchInput).toHaveValue("s")

    await page.locator('.hg-button[data-skbtn="p"]').click()
    await expect(searchInput).toHaveValue("sp")

    await page.locator('.hg-button[data-skbtn="i"]').click()
    await expect(searchInput).toHaveValue("spi")

    await page.locator('.hg-button[data-skbtn="{bksp}"]').click()
    await expect(searchInput).toHaveValue("sp")

    await page.getByRole("option", { name: personalLocationName }).click()
    await expect(searchInput).toBeHidden()

    await expect(page.locator("[data-kiosk-keyboard]")).not.toBeVisible()
  })
})
