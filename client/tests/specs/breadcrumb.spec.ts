import { expect, test } from "@playwright/test"
import { BreadcrumbPage } from "../pages/BreadcrumbPage"

test.use({ storageState: "playwright/.auth/admin.json" })

test.describe("Breadcrumb", () => {
  test("shows breadcrumb on the members page", async ({ page }) => {
    const breadcrumb = new BreadcrumbPage(page)
    await page.goto("/members")

    await expect(breadcrumb.crumb("Mitglieder")).toBeVisible()
  })

  test("breadcrumb link on parent segment navigates to that route", async ({
    page,
  }) => {
    const breadcrumb = new BreadcrumbPage(page)
    await page.goto("/members/new")

    // "Mitglieder" should be a clickable link (not the last crumb)
    await expect(breadcrumb.crumbLink("Mitglieder")).toBeVisible()
    await breadcrumb.crumbLink("Mitglieder").click()
    await expect(page).toHaveURL(/\/members$/)
  })
})
