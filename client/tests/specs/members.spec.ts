import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createClothingItem } from "../flows/createClothingItem"
import { createClothingLocation } from "../flows/createClothingLocation"
import { createClothingType } from "../flows/createClothingType"
import { createMember } from "../flows/createMember"
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

  test("edits an existing member", async ({ page }) => {
    const name = `Test-Mitglied-${randomUUID().slice(0, 8)}`
    const updatedName = `${name}-bearbeitet`
    const membersPage = new MembersPage(page)

    await createMember(page, name)
    await membersPage.clickEditForMember(name)
    await membersPage.fillName(updatedName)
    await membersPage.submitForm()

    await expect(page).toHaveURL(/\/members$/)
    await expect(membersPage.memberRow(updatedName)).toBeVisible()
  })

  test("warns about duplicate names but allows confirmation", async ({
    page,
  }) => {
    const name = `Test-Mitglied-${randomUUID().slice(0, 8)}`
    const membersPage = new MembersPage(page)

    await createMember(page, name)
    await membersPage.gotoNew()
    await membersPage.fillName(name)
    await membersPage.submitForm()

    await expect(membersPage.duplicateWarning()).toBeVisible()
    await membersPage.confirmDuplicate()
    await expect(page).toHaveURL(/\/members$/)
    await expect(membersPage.memberRow(name)).toHaveCount(2)
  })

  test("searches members by name", async ({ page }) => {
    const name = `Test-Mitglied-${randomUUID().slice(0, 8)}`
    const membersPage = new MembersPage(page)

    await createMember(page, name)
    await membersPage.fillSearch(name)

    await expect(membersPage.memberRow(name)).toBeVisible()
  })

  test("shows a member's Standorte as chips linking to the Standort edit page", async ({
    page,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const firstLocation = `Spind-A-${suffix}`
    const secondLocation = `Spind-B-${suffix}`
    const membersPage = new MembersPage(page)

    await createMember(page, memberName)
    await createClothingLocation(page, {
      type: "PERSONAL",
      name: firstLocation,
      memberName,
    })
    await createClothingLocation(page, {
      type: "PERSONAL",
      name: secondLocation,
      memberName,
    })
    await membersPage.goto()

    await expect(
      membersPage.locationChip(memberName, firstLocation),
    ).toBeVisible()
    await expect(
      membersPage.locationChip(memberName, secondLocation),
    ).toBeVisible()

    await membersPage.locationChip(memberName, secondLocation).click()
    await expect(page).toHaveURL(/\/clothing-management\/locations\/\d+\/edit$/)
    await expect(
      page.getByRole("textbox", { name: /^Bezeichnung( Erforderlich)?$/ }),
    ).toHaveValue(secondLocation)
  })

  test("shows a dash for a member without Standorte", async ({ page }) => {
    const name = `Test-Mitglied-${randomUUID().slice(0, 8)}`
    const membersPage = new MembersPage(page)

    await createMember(page, name)
    await membersPage.goto()

    await expect(membersPage.locationsCell(name)).toHaveText("–")
  })

  test("opens the member detail page showing audit metadata", async ({
    page,
  }) => {
    const name = `Test-Mitglied-${randomUUID().slice(0, 8)}`
    const membersPage = new MembersPage(page)
    const detailPage = new MemberDetailPage(page)

    await createMember(page, name)
    await membersPage.clickMemberName(name)

    await expect(page).toHaveURL(/\/members\/\d+$/)
    await expect(detailPage.heading(name)).toBeVisible()
    await expect(detailPage.metadata()).toContainText("Erstellt")
    await expect(detailPage.metadata()).toContainText("Zuletzt geändert")
  })

  test("lists the member's Standorte with links to the Standort edit page", async ({
    page,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const locationName = `Spind-${suffix}`
    const membersPage = new MembersPage(page)
    const detailPage = new MemberDetailPage(page)

    await createMember(page, memberName)
    await createClothingLocation(page, {
      type: "PERSONAL",
      name: locationName,
      memberName,
    })
    await membersPage.goto()
    await membersPage.clickMemberName(memberName)

    await expect(detailPage.locationLink(locationName)).toBeVisible()
    await detailPage.locationLink(locationName).click()
    await expect(page).toHaveURL(/\/clothing-management\/locations\/\d+\/edit$/)
    await expect(
      page.getByRole("textbox", { name: /^Bezeichnung( Erforderlich)?$/ }),
    ).toHaveValue(locationName)
  })

  test("shows an empty state when the member has no Standorte", async ({
    page,
  }) => {
    const name = `Test-Mitglied-${randomUUID().slice(0, 8)}`
    const membersPage = new MembersPage(page)
    const detailPage = new MemberDetailPage(page)

    await createMember(page, name)
    await membersPage.clickMemberName(name)

    await expect(detailPage.locationEmptyState()).toBeVisible()
    await expect(detailPage.clothingEmptyState()).toBeVisible()
  })

  test("lists the clothing in the member's Standorte grouped by Standort", async ({
    page,
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

    await createMember(page, memberName)
    await createClothingLocation(page, {
      type: "PERSONAL",
      name: locationA,
      memberName,
    })
    await createClothingLocation(page, {
      type: "PERSONAL",
      name: locationB,
      memberName,
    })
    await createClothingType(page, typeA)
    await createClothingType(page, typeB)
    await createClothingItem(page, {
      typeName: typeA,
      size: "XXL",
      barcode: barcodeA,
      locationName: locationA,
    })
    await createClothingItem(page, {
      typeName: typeB,
      size: "XXS",
      barcode: barcodeB,
      locationName: locationB,
    })

    await membersPage.goto()
    await membersPage.clickMemberName(memberName)

    const groupA = detailPage.clothingGroup(locationA)
    await expect(groupA).toContainText(typeA)
    await expect(groupA).toContainText("XXL")
    await expect(groupA).toContainText(barcodeA)
    await expect(groupA).not.toContainText(typeB)
    await expect(groupA).not.toContainText(barcodeB)

    const groupB = detailPage.clothingGroup(locationB)
    await expect(groupB).toContainText(typeB)
    await expect(groupB).toContainText("XXS")
    await expect(groupB).toContainText(barcodeB)
    await expect(groupB).not.toContainText(typeA)
    await expect(groupB).not.toContainText(barcodeA)
  })

  test("warns about affected Standorte and clothing before deleting the member", async ({
    page,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const locationName = `Spind-${suffix}`
    const typeName = `Jacke-${suffix}`
    const membersPage = new MembersPage(page)
    const detailPage = new MemberDetailPage(page)
    const locationsPage = new ClothingLocationsPage(page)

    await createMember(page, memberName)
    await createClothingLocation(page, {
      type: "PERSONAL",
      name: locationName,
      memberName,
    })
    await createClothingType(page, typeName)
    await createClothingItem(page, {
      typeName,
      size: "XXL",
      barcode: `BC-${suffix}-1`,
      locationName,
    })
    await createClothingItem(page, {
      typeName,
      size: "XXL",
      barcode: `BC-${suffix}-2`,
      locationName,
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

  test("warns about multiple affected Standorte and clothing items before deleting", async ({
    page,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const firstLocation = `Spind-A-${suffix}`
    const secondLocation = `Spind-B-${suffix}`
    const typeName = `Jacke-${suffix}`
    const membersPage = new MembersPage(page)
    const detailPage = new MemberDetailPage(page)

    await createMember(page, memberName)
    await createClothingLocation(page, {
      type: "PERSONAL",
      name: firstLocation,
      memberName,
    })
    await createClothingLocation(page, {
      type: "PERSONAL",
      name: secondLocation,
      memberName,
    })
    await createClothingType(page, typeName)
    await createClothingItem(page, {
      typeName,
      size: "XXL",
      barcode: `BC-${suffix}-1`,
      locationName: firstLocation,
    })
    await createClothingItem(page, {
      typeName,
      size: "XXL",
      barcode: `BC-${suffix}-2`,
      locationName: secondLocation,
    })

    await membersPage.goto()
    await membersPage.clickMemberName(memberName)
    await detailPage.clickDelete()

    await expect(detailPage.deleteDialog()).toContainText("2 Standorte")
    await expect(detailPage.deleteDialog()).toContainText("2 Kleidungsstücke")
    await expect(detailPage.deleteDialog()).toContainText("umgelagert")
  })

  test("deletes a member from the list after warning about affected Standorte and clothing", async ({
    page,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const locationName = `Spind-${suffix}`
    const typeName = `Jacke-${suffix}`
    const membersPage = new MembersPage(page)
    const locationsPage = new ClothingLocationsPage(page)

    await createMember(page, memberName)
    await createClothingLocation(page, {
      type: "PERSONAL",
      name: locationName,
      memberName,
    })
    await createClothingType(page, typeName)
    await createClothingItem(page, {
      typeName,
      size: "XXL",
      barcode: `BC-${suffix}-1`,
      locationName,
    })
    await createClothingItem(page, {
      typeName,
      size: "XXL",
      barcode: `BC-${suffix}-2`,
      locationName,
    })

    await membersPage.goto()
    await membersPage.clickDeleteForMember(memberName)

    await expect(membersPage.deleteDialog()).toContainText("1 Standort")
    await expect(membersPage.deleteDialog()).toContainText("2 Kleidungsstücke")
    await expect(membersPage.deleteDialog()).toContainText("umgelagert")

    await membersPage.confirmDelete()

    await expect(membersPage.memberRow(memberName)).not.toBeVisible()

    await locationsPage.goto()
    await expect(locationsPage.locationRow(locationName)).toBeVisible()
    await expect(locationsPage.locationRow(locationName)).not.toContainText(
      memberName,
    )
  })

  test("shows an empty state for a Standort without clothing", async ({
    page,
  }) => {
    const suffix = randomUUID().slice(0, 8)
    const memberName = `Mitglied-${suffix}`
    const locationName = `Spind-${suffix}`
    const membersPage = new MembersPage(page)
    const detailPage = new MemberDetailPage(page)

    await createMember(page, memberName)
    await createClothingLocation(page, {
      type: "PERSONAL",
      name: locationName,
      memberName,
    })

    await membersPage.goto()
    await membersPage.clickMemberName(memberName)

    await expect(detailPage.clothingGroup(locationName)).toContainText(
      "Keine Kleidung an diesem Standort.",
    )
  })

  test("renders breadcrumbs on member pages", async ({ page }) => {
    const name = `Test-Mitglied-${randomUUID().slice(0, 8)}`
    const membersPage = new MembersPage(page)

    await createMember(page, name)
    await membersPage.goto()
    await expect(
      page
        .getByRole("navigation", { name: "Breadcrumb" })
        .getByText("Mitglieder"),
    ).toBeVisible()

    await membersPage.gotoNew()
    await expect(
      page
        .getByRole("navigation", { name: "Breadcrumb" })
        .getByText("Mitglieder"),
    ).toBeVisible()

    await membersPage.goto()
    await membersPage.clickEditForMember(name)
    await expect(
      page
        .getByRole("navigation", { name: "Breadcrumb" })
        .getByText("Mitglieder"),
    ).toBeVisible()
  })
})

test.describe("Members navigation", () => {
  test.use({ storageState: "playwright/.auth/user.json" })

  test("hides members navigation from users without the role", async ({
    page,
  }) => {
    await page.goto("/dashboard")

    await expect(
      page.getByRole("link", { name: "Mitglieder" }),
    ).not.toBeVisible()
  })
})
