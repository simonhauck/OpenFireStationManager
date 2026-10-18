import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import {
  seedClothingItem,
  seedClothingLocation,
  seedClothingType,
  seedMember,
} from "../api/seeding"
import { ClothingLocationsPage } from "../pages/ClothingLocationsPage"
import { MemberDetailPage } from "../pages/MemberDetailPage"
import { MembersPage } from "../pages/MembersPage"

test.describe("Members", () => {
  test.use({ storageState: "playwright/.auth/kleiderwart.json" })

  test("creates a member and shows it in the list", async ({ page }) => {
    const name = `Test-Mitglied-${randomUUID().slice(0, 8)}`
    const membersPage = new MembersPage(page)

    await membersPage.goto()
    await membersPage.clickCreate()
    await membersPage.fillName(name)
    await membersPage.submitForm()

    await expect(page).toHaveURL(/\/members$/)
    await expect(membersPage.memberRow(name)).toBeVisible()
  })

  test("edits an existing member", async ({ page, request }) => {
    const name = `Test-Mitglied-${randomUUID().slice(0, 8)}`
    const updatedName = `${name}-bearbeitet`
    const membersPage = new MembersPage(page)

    await seedMember(request, name)
    await membersPage.goto()
    await membersPage.clickEditForMember(name)
    await membersPage.fillName(updatedName)
    await membersPage.submitForm()

    await expect(page).toHaveURL(/\/members$/)
    await expect(membersPage.memberRow(updatedName)).toBeVisible()
  })

  test("shows a member's Standorte as links to the Standort detail page", async ({
    page,
    request,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const firstLocation = `Spind-A-${suffix}`
    const secondLocation = `Spind-B-${suffix}`
    const membersPage = new MembersPage(page)

    const member = await seedMember(request, memberName)
    await seedClothingLocation(request, {
      name: firstLocation,
      type: "PERSONAL",
      memberId: member.id,
    })
    await seedClothingLocation(request, {
      name: secondLocation,
      type: "PERSONAL",
      memberId: member.id,
    })
    await membersPage.goto()

    await expect(
      membersPage.locationLink(memberName, firstLocation),
    ).toBeVisible()
    await expect(
      membersPage.locationLink(memberName, secondLocation),
    ).toBeVisible()

    await membersPage.locationLink(memberName, secondLocation).click()
    await expect(page).toHaveURL(/\/clothing-management\/locations\/\d+$/)
    await expect(
      page.getByRole("heading", { name: secondLocation, level: 1 }),
    ).toBeVisible()
  })

  test("opens the member detail page showing audit metadata", async ({
    page,
    request,
  }) => {
    const name = `Test-Mitglied-${randomUUID().slice(0, 8)}`
    const membersPage = new MembersPage(page)
    const detailPage = new MemberDetailPage(page)

    await seedMember(request, name)
    await membersPage.goto()
    await membersPage.clickMemberName(name)

    await expect(page).toHaveURL(/\/members\/\d+$/)
    await expect(detailPage.heading(name)).toBeVisible()
    await expect(detailPage.metadata()).toContainText("Erstellt")
    await expect(detailPage.metadata()).toContainText("Zuletzt geändert")
  })

  test("lists the member's Standorte with links to the Standort detail page", async ({
    page,
    request,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const locationName = `Spind-${suffix}`
    const membersPage = new MembersPage(page)
    const detailPage = new MemberDetailPage(page)

    const member = await seedMember(request, memberName)
    await seedClothingLocation(request, {
      name: locationName,
      type: "PERSONAL",
      memberId: member.id,
    })
    await membersPage.goto()
    await membersPage.clickMemberName(memberName)

    await expect(detailPage.locationLink(locationName)).toBeVisible()
    await detailPage.locationLink(locationName).click()
    await expect(page).toHaveURL(/\/clothing-management\/locations\/\d+$/)
    await expect(
      page.getByRole("heading", { name: locationName, level: 1 }),
    ).toBeVisible()
  })

  test("lists the clothing in the member's Standorte grouped by Standort", async ({
    page,
    request,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const locationA = `Spind-A-${suffix}`
    const locationB = `Spind-B-${suffix}`
    const typeA = `Jacke-${suffix}`
    const typeB = `Helm-${suffix}`
    const barcodeA = `BC-A-${suffix}`
    const barcodeB = `BC-B-${suffix}`
    const membersPage = new MembersPage(page)
    const detailPage = new MemberDetailPage(page)

    const member = await seedMember(request, memberName)
    const locationOne = await seedClothingLocation(request, {
      name: locationA,
      type: "PERSONAL",
      memberId: member.id,
    })
    const locationTwo = await seedClothingLocation(request, {
      name: locationB,
      type: "PERSONAL",
      memberId: member.id,
    })
    const clothingTypeA = await seedClothingType(request, typeA)
    const clothingTypeB = await seedClothingType(request, typeB)
    await seedClothingItem(request, {
      typeId: clothingTypeA.id,
      size: "XXL",
      barcode: barcodeA,
      locationId: locationOne.id,
    })
    await seedClothingItem(request, {
      typeId: clothingTypeB.id,
      size: "XXS",
      barcode: barcodeB,
      locationId: locationTwo.id,
    })

    await membersPage.goto()
    await membersPage.clickMemberName(memberName)

    const groupA = detailPage.clothingGroup(locationA)
    await expect(groupA).toContainText(typeA)
    await expect(groupA).toContainText("XXL")
    await expect(groupA).toContainText(barcodeA)
    await expect(groupA).not.toContainText(typeB)
    await expect(
      groupA.getByRole("link", { name: "Details", exact: true }),
    ).toHaveAttribute(
      "href",
      `/clothing-management/locations/${locationOne.id}`,
    )

    const groupB = detailPage.clothingGroup(locationB)
    await expect(groupB).toContainText(typeB)
    await expect(groupB).toContainText("XXS")
    await expect(groupB).toContainText(barcodeB)
    await expect(groupB).not.toContainText(typeA)
  })

  test("warns about affected Standorte and clothing before deleting the member", async ({
    page,
    request,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const locationName = `Spind-${suffix}`
    const typeName = `Jacke-${suffix}`
    const membersPage = new MembersPage(page)
    const detailPage = new MemberDetailPage(page)
    const locationsPage = new ClothingLocationsPage(page)

    const member = await seedMember(request, memberName)
    const location = await seedClothingLocation(request, {
      name: locationName,
      type: "PERSONAL",
      memberId: member.id,
    })
    const type = await seedClothingType(request, typeName)
    await seedClothingItem(request, {
      typeId: type.id,
      size: "XXL",
      barcode: `BC-${suffix}-1`,
      locationId: location.id,
    })
    await seedClothingItem(request, {
      typeId: type.id,
      size: "XXL",
      barcode: `BC-${suffix}-2`,
      locationId: location.id,
    })

    await membersPage.goto()
    await membersPage.clickMemberName(memberName)
    await detailPage.clickDelete()

    await expect(detailPage.deleteDialog()).toContainText("1 Standort")
    await expect(detailPage.deleteDialog()).toContainText("2 Kleidungsstücke")
    await expect(detailPage.deleteDialog()).toContainText("umgelagert")

    await detailPage.confirmDelete()

    await expect(page).toHaveURL(/\/members$/)
    await expect(membersPage.memberRow(memberName)).not.toBeVisible()

    await locationsPage.goto()
    await expect(locationsPage.locationRow(locationName)).toBeVisible()
    await expect(locationsPage.locationRow(locationName)).not.toContainText(
      memberName,
    )
  })

  test("deletes a member from the list after warning about affected Standorte and clothing", async ({
    page,
    request,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const locationName = `Spind-${suffix}`
    const typeName = `Jacke-${suffix}`
    const membersPage = new MembersPage(page)
    const locationsPage = new ClothingLocationsPage(page)

    const member = await seedMember(request, memberName)
    const location = await seedClothingLocation(request, {
      name: locationName,
      type: "PERSONAL",
      memberId: member.id,
    })
    const type = await seedClothingType(request, typeName)
    await seedClothingItem(request, {
      typeId: type.id,
      size: "XXL",
      barcode: `BC-${suffix}-1`,
      locationId: location.id,
    })

    await membersPage.goto()
    await membersPage.clickDeleteForMember(memberName)

    await expect(membersPage.deleteDialog()).toContainText("1 Standort")
    await expect(membersPage.deleteDialog()).toContainText("1 Kleidungsstück")
    await expect(membersPage.deleteDialog()).toContainText("umgelagert")

    await membersPage.confirmDelete()

    await expect(membersPage.memberRow(memberName)).not.toBeVisible()

    await locationsPage.goto()
    await expect(locationsPage.locationRow(locationName)).not.toContainText(
      memberName,
    )
  })
})
