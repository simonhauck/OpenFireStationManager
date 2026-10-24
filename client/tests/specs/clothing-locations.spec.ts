import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import {
  seedClothingItem,
  seedClothingLocation,
  seedClothingType,
  seedMember,
} from "../api/seeding"
import { ClothingLocationDetailPage } from "../pages/ClothingLocationDetailPage"
import { ClothingLocationsPage } from "../pages/ClothingLocationsPage"

test.use({ storageState: "playwright/.auth/kleiderwart.json" })

test.describe("Clothing Locations", () => {
  test("opens the location detail page from the list with member and clothing", async ({
    page,
    request,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const locationName = `Spind-${suffix}`
    const typeName = `Jacke-${suffix}`
    const barcode = `BC-${suffix}`
    const locationsPage = new ClothingLocationsPage(page)
    const detailPage = new ClothingLocationDetailPage(page)

    const member = await seedMember(request, memberName)
    const location = await seedClothingLocation(request, {
      name: locationName,
      type: "PERSONAL",
      comment: "Hintere Reihe",
      memberId: member.id,
    })
    const type = await seedClothingType(request, typeName)
    await seedClothingItem(request, {
      typeId: type.id,
      size: "XL",
      barcode,
      locationId: location.id,
    })

    await locationsPage.goto()
    await locationsPage.locationNameLink(locationName).click()

    await expect(page).toHaveURL(
      new RegExp(`/clothing-management/locations/${location.id}$`),
    )
    await expect(detailPage.heading(locationName)).toBeVisible()
    await expect(detailPage.detailsSection()).toContainText(
      "Persönlicher Standort",
    )
    await expect(detailPage.detailsSection()).toContainText("Hintere Reihe")
    await expect(detailPage.memberLink(memberName)).toHaveAttribute(
      "href",
      `/members/${member.id}`,
    )
    await expect(detailPage.itemRow(barcode)).toContainText(typeName)
    await expect(detailPage.itemRow(barcode)).toContainText("XL")
  })

  test("navigates from a clothing item on the detail page to the item edit page", async ({
    page,
    request,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const locationName = `Spind-${suffix}`
    const typeName = `Helm-${suffix}`
    const barcode = `BC-Item-${suffix}`
    const detailPage = new ClothingLocationDetailPage(page)

    const location = await seedClothingLocation(request, {
      name: locationName,
      type: "OTHER",
    })
    const type = await seedClothingType(request, typeName)
    const item = await seedClothingItem(request, {
      typeId: type.id,
      size: "L",
      barcode,
      locationId: location.id,
    })

    await detailPage.goto(location.id)
    await expect(detailPage.itemRow(barcode)).toBeVisible()
    await detailPage.itemLink(barcode, typeName).click()

    await expect(page).toHaveURL(
      new RegExp(`/clothing-management/items/${item.id}/edit$`),
    )
    await expect(
      page.getByRole("textbox", { name: /^Größe( Erforderlich)?$/ }),
    ).toHaveValue("L")
  })

  test("returns to the location detail page after editing", async ({
    page,
    request,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const name = `Test-Standort-${suffix}`
    const updatedName = `${name}-bearbeitet`
    const locationsPage = new ClothingLocationsPage(page)
    const detailPage = new ClothingLocationDetailPage(page)

    const location = await seedClothingLocation(request, {
      name,
      type: "POOL",
    })

    await locationsPage.goto()
    await locationsPage.clickEditForLocation(name)
    await locationsPage.fillName(updatedName)
    await locationsPage.submitForm()

    await expect(page).toHaveURL(
      new RegExp(`/clothing-management/locations/${location.id}$`),
    )
    await expect(detailPage.heading(updatedName)).toBeVisible()
  })

  test("lands on the new detail page after creating a location", async ({
    page,
  }) => {
    const name = `Test-Standort-${randomUUID().slice(0, 8)}`
    const locationsPage = new ClothingLocationsPage(page)
    const detailPage = new ClothingLocationDetailPage(page)

    await locationsPage.goto()
    await locationsPage.clickCreateSingle()
    await locationsPage.selectType("POOL")
    await locationsPage.fillName(name)
    await locationsPage.fillComment("Automatischer Test")
    await locationsPage.submitForm()

    await expect(page).toHaveURL(/\/clothing-management\/locations\/\d+$/)
    await expect(detailPage.heading(name)).toBeVisible()
    await expect(detailPage.detailsSection()).toContainText("Pool")
  })

  test("deletes a location from the detail page with the shared warning", async ({
    page,
    request,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const name = `Test-Standort-${suffix}`
    const typeName = `Jacke-${suffix}`
    const barcode = `BC-Delete-${suffix}`
    const locationsPage = new ClothingLocationsPage(page)
    const detailPage = new ClothingLocationDetailPage(page)

    const location = await seedClothingLocation(request, {
      name,
      type: "POOL",
    })
    const type = await seedClothingType(request, typeName)
    await seedClothingItem(request, {
      typeId: type.id,
      size: "L",
      barcode,
      locationId: location.id,
    })

    await detailPage.goto(location.id)
    await detailPage.clickDelete()

    await expect(detailPage.deleteDialog()).toContainText(
      `Möchten Sie den Standort „${name}“ wirklich löschen?`,
    )
    await expect(detailPage.deleteDialog()).toContainText(
      "Kleidungsstücke an diesem Standort verlieren dabei ihre Standortzuordnung.",
    )

    await detailPage.confirmDelete()

    await expect(page).toHaveURL(/\/clothing-management\/locations$/)
    await expect(locationsPage.locationRow(name)).not.toBeVisible()
  })

  test("assigns a member to a personal location", async ({ page, request }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const locationName = `Spind-${suffix}`
    const locationsPage = new ClothingLocationsPage(page)
    const detailPage = new ClothingLocationDetailPage(page)

    await seedMember(request, memberName)

    await locationsPage.gotoNew()
    await locationsPage.selectType("PERSONAL")
    await locationsPage.fillName(locationName)
    await locationsPage.selectMember(memberName)
    await locationsPage.submitForm()
    await expect(page).toHaveURL(/\/clothing-management\/locations\/\d+$/)

    await expect(detailPage.memberLink(memberName)).toBeVisible()

    await locationsPage.goto()
    await expect(locationsPage.locationRow(locationName)).toContainText(
      memberName,
    )
  })
})
