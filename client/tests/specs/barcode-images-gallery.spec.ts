import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createClothingLocation } from "../flows/createClothingLocation"
import { createClothingType } from "../flows/createClothingType"
import { CheckoutPage } from "../pages/CheckoutPage"
import { ClothingTypesPage } from "../pages/ClothingTypesPage"

// The checkout route is guarded to USER role only.
test.use({ storageState: "playwright/.auth/user.json" })

test.describe("Barcode images gallery", () => {
  let typeWithImage: string
  let typeWithoutImage: string
  let personalLocationName: string

  test.beforeAll(async ({ browser }) => {
    const suffix = randomUUID().slice(0, 8)
    typeWithImage = `Typ-Galerie-${suffix}`
    typeWithoutImage = `Typ-Ohne-Bild-${suffix}`
    personalLocationName = `Spind-Galerie-${suffix}`

    // Setup requires KLEIDERWART role — use a dedicated page for preconditions.
    const page = await browser.newPage({
      storageState: "playwright/.auth/kleiderwart.json",
    })
    const typesPage = new ClothingTypesPage(page)

    await createClothingType(page, typeWithImage)
    await createClothingType(page, typeWithoutImage)

    await typesPage.goto()
    await typesPage.clickEditForType(typeWithImage)
    await typesPage.selectImages(["tests/fixtures/barcode.png"])
    await typesPage.uploadSelectedImage()
    await expect(typesPage.typeImageThumbnails()).toHaveCount(1)

    await createClothingLocation(page, {
      type: "PERSONAL",
      name: personalLocationName,
    })

    await page.close()
  })

  test("shows the types that have barcode images while scanning", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(personalLocationName)

    const gallery = checkoutPage.barcodeGallery()
    await expect(gallery).toBeVisible()
    await expect(
      gallery.getByText(typeWithImage, { exact: true }),
    ).toBeVisible()
    await expect(
      gallery.getByText(typeWithoutImage, { exact: true }),
    ).not.toBeVisible()

    const imageBox = await gallery.locator("img").first().boundingBox()
    expect(imageBox?.height ?? 0).toBeGreaterThanOrEqual(150)
  })
})
