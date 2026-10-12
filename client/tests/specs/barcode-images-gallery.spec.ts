import { randomUUID } from "node:crypto"
import { type APIRequestContext, expect, test } from "@playwright/test"
import {
  createSeedRequest,
  seedClothingLocation,
  seedClothingType,
} from "../api/seeding"
import { CheckoutPage } from "../pages/CheckoutPage"
import { ClothingTypesPage } from "../pages/ClothingTypesPage"

// The checkout route is guarded to USER role only.
test.use({ storageState: "playwright/.auth/user.json" })

test.describe("Barcode images gallery", () => {
  let api: APIRequestContext
  let typeWithImage: string
  let typeWithoutImage: string
  let personalLocationName: string

  test.beforeAll(async ({ browser }) => {
    const suffix = randomUUID().slice(0, 8)
    typeWithImage = `Typ-Galerie-${suffix}`
    typeWithoutImage = `Typ-Ohne-Bild-${suffix}`
    personalLocationName = `Spind-Galerie-${suffix}`

    api = await createSeedRequest()
    await seedClothingType(api, typeWithImage)
    await seedClothingType(api, typeWithoutImage)
    await seedClothingLocation(api, {
      name: personalLocationName,
      type: "PERSONAL",
    })

    // Image upload has no seeding endpoint — manage it through the UI.
    const page = await browser.newPage({
      storageState: "playwright/.auth/kleiderwart.json",
    })
    const typesPage = new ClothingTypesPage(page)
    await typesPage.goto()
    await typesPage.clickEditForType(typeWithImage)
    await typesPage.selectImages(["tests/fixtures/barcode.png"])
    await typesPage.uploadSelectedImage()
    await expect(typesPage.typeImageThumbnails()).toHaveCount(1)
    await page.close()
  })

  test.afterAll(async () => {
    await api.dispose()
  })

  test("shows the types that have barcode images in the guide dialog", async ({
    page,
  }) => {
    const checkoutPage = new CheckoutPage(page)

    await checkoutPage.goto()
    await checkoutPage.selectPersonalLocation(personalLocationName)

    // The guide is off the main screen: only its trigger is visible.
    await expect(checkoutPage.barcodeGalleryButton()).toBeVisible()
    await expect(page.getByTestId("barcode-images-gallery")).not.toBeVisible()

    await checkoutPage.openBarcodeGallery()

    const gallery = checkoutPage.barcodeGallery()
    await expect(gallery).toBeVisible()
    await expect(
      gallery.getByText(typeWithImage, { exact: true }),
    ).toBeVisible()
    await expect(
      gallery.getByText(typeWithoutImage, { exact: true }),
    ).not.toBeVisible()

    const imageBox = await gallery.locator("img").first().boundingBox()
    expect(imageBox?.height ?? 0).toBeGreaterThanOrEqual(240)
  })
})
