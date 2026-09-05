import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { createMember } from "../flows/createMember"
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
