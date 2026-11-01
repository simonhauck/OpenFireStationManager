import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { seedClothingLocation } from "../api/seeding"
import { PoolKlamottenPage } from "../pages/PoolKlamottenPage"

test.describe("Pool Klamotten – Standort details access", () => {
  test.describe("as USER", () => {
    test.use({ storageState: "playwright/.auth/user.json" })

    test("hides the Standort details link", async ({ page, request }) => {
      const locationName = `Pool-${randomUUID().slice(0, 8)}`
      await seedClothingLocation(request, {
        name: locationName,
        type: "POOL",
      })

      const poolPage = new PoolKlamottenPage(page)
      await poolPage.goto()

      await expect(poolPage.locationSection(locationName)).toBeVisible()
      await expect(poolPage.detailsLink(locationName)).toHaveCount(0)
    })
  })

  test.describe("as KLEIDERWART", () => {
    test.use({ storageState: "playwright/.auth/kleiderwart.json" })

    test("shows the Standort details link", async ({ page, request }) => {
      const locationName = `Pool-${randomUUID().slice(0, 8)}`
      const location = await seedClothingLocation(request, {
        name: locationName,
        type: "POOL",
      })

      const poolPage = new PoolKlamottenPage(page)
      await poolPage.goto()

      await expect(poolPage.locationSection(locationName)).toBeVisible()
      await expect(poolPage.detailsLink(locationName)).toBeVisible()

      await poolPage.detailsLink(locationName).click()
      await expect(page).toHaveURL(
        new RegExp(`/clothing-management/locations/${location.id}$`),
      )
    })
  })
})
