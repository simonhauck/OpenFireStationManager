import { expect, test } from "@playwright/test"
import { BreadcrumbPage } from "../pages/BreadcrumbPage"

test.use({ storageState: "playwright/.auth/admin.json" })

test.describe("Breadcrumb", () => {
  test("shows breadcrumb on user management page", async ({ page }) => {
    const breadcrumb = new BreadcrumbPage(page)
    await page.goto("/user-management")

    await expect(breadcrumb.crumb("Nutzer Management")).toBeVisible()
  })

  test("breadcrumb link on parent segment navigates to that route", async ({
    page,
  }) => {
    const breadcrumb = new BreadcrumbPage(page)
    await page.goto("/user-management/new")

    // "Nutzer Management" should be a clickable link (not the last crumb)
    await expect(breadcrumb.crumbLink("Nutzer Management")).toBeVisible()
    await breadcrumb.crumbLink("Nutzer Management").click()
    await expect(page).toHaveURL(/\/user-management$/)
  })
})
