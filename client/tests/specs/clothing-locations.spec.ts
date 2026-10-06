import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createMember } from "../flows/createMember"
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

  test("assigns a member to a personal location and clears the owner again", async ({
    page,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const locationName = `Spind-${suffix}`
    const locationsPage = new ClothingLocationsPage(page)

    await createMember(page, memberName)

    await locationsPage.gotoNew()
    await locationsPage.selectType("PERSONAL")
    await locationsPage.fillName(locationName)
    await locationsPage.selectMember(memberName)
    await locationsPage.submitForm()
    await expect(page).toHaveURL(/\/clothing-management\/locations$/)

    await expect(locationsPage.locationRow(locationName)).toContainText(
      memberName,
    )

    await locationsPage.clickEditForLocation(locationName)
    await locationsPage.clearMember()
    await locationsPage.submitForm()
    await expect(page).toHaveURL(/\/clothing-management\/locations$/)

    await expect(locationsPage.locationRow(locationName)).not.toContainText(
      memberName,
    )
  })

  test("offers the member picker only for personal locations", async ({
    page,
  }) => {
    const locationsPage = new ClothingLocationsPage(page)

    await locationsPage.gotoNew()
    await locationsPage.selectType("OTHER")
    await expect(locationsPage.memberPicker()).not.toBeVisible()

    await locationsPage.selectType("PERSONAL")
    await expect(locationsPage.memberPicker()).toBeVisible()
  })

  test("deletes a location", async ({ page }) => {
    const name = `Test-Standort-${randomUUID().slice(0, 8)}`
    const locationsPage = new ClothingLocationsPage(page)

    await locationsPage.gotoNew()
    await locationsPage.selectType("OTHER")
    await locationsPage.fillName(name)
    await locationsPage.submitForm()
    await expect(page).toHaveURL(/\/clothing-management\/locations$/)
    await expect(locationsPage.locationRow(name)).toBeVisible()

    await locationsPage.clickDeleteForLocation(name)
    await locationsPage.confirmDelete()

    await expect(locationsPage.locationRow(name)).not.toBeVisible()
  })
})
