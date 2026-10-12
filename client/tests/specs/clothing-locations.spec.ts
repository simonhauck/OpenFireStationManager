import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { seedMember } from "../api/seeding"
import { ClothingLocationsPage } from "../pages/ClothingLocationsPage"

test.use({ storageState: "playwright/.auth/kleiderwart.json" })

test.describe("Clothing Locations", () => {
  test("creates a new location and shows it in the list", async ({ page }) => {
    const name = `Test-Standort-${randomUUID().slice(0, 8)}`
    const locationsPage = new ClothingLocationsPage(page)

    await locationsPage.goto()
    await locationsPage.clickCreateSingle()
    await locationsPage.selectType("POOL")
    await locationsPage.fillName(name)
    await locationsPage.fillComment("Automatischer Test")
    await locationsPage.submitForm()

    await expect(page).toHaveURL(/\/clothing-management\/locations$/)
    await expect(locationsPage.locationRow(name)).toBeVisible()
  })

  test("edits an existing location", async ({ page }) => {
    const name = `Test-Standort-${randomUUID().slice(0, 8)}`
    const updatedName = `${name}-bearbeitet`
    const locationsPage = new ClothingLocationsPage(page)

    await locationsPage.gotoNew()
    await locationsPage.selectType("POOL")
    await locationsPage.fillName(name)
    await locationsPage.submitForm()
    await expect(page).toHaveURL(/\/clothing-management\/locations$/)

    await locationsPage.clickEditForLocation(name)
    await locationsPage.fillName(updatedName)
    await locationsPage.submitForm()

    await expect(page).toHaveURL(/\/clothing-management\/locations$/)
    await expect(locationsPage.locationRow(updatedName)).toBeVisible()
  })

  test("assigns a member to a personal location", async ({ page, request }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const locationName = `Spind-${suffix}`
    const locationsPage = new ClothingLocationsPage(page)

    await seedMember(request, memberName)

    await locationsPage.gotoNew()
    await locationsPage.selectType("PERSONAL")
    await locationsPage.fillName(locationName)
    await locationsPage.selectMember(memberName)
    await locationsPage.submitForm()
    await expect(page).toHaveURL(/\/clothing-management\/locations$/)

    await expect(locationsPage.locationRow(locationName)).toContainText(
      memberName,
    )
  })
})
