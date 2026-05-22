import { expect, test } from "@playwright/test"
import { BreadcrumbPage } from "../pages/BreadcrumbPage"

test.use({ storageState: "playwright/.auth/admin.json" })

test.describe("Breadcrumb", () => {
  test("shows breadcrumb on user management page", async ({ page }) => {
    const breadcrumb = new BreadcrumbPage(page)
    await page.goto("/user-management")

    await expect(breadcrumb.crumb("Nutzer Management")).toBeVisible()
  })

  test("home link navigates to root", async ({ page }) => {
    const breadcrumb = new BreadcrumbPage(page)
    await page.goto("/user-management")

    await breadcrumb.homeLink().click()
    await expect(page).toHaveURL("/")
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

  test("last breadcrumb segment is not a link", async ({ page }) => {
    const breadcrumb = new BreadcrumbPage(page)
    await page.goto("/user-management/new")

    // "Neu" is the last crumb — should be plain text, not a link
    await expect(breadcrumb.crumb("Neu")).toBeVisible()
    await expect(
      breadcrumb.breadcrumb().getByRole("link", { name: "Neu" }),
    ).not.toBeVisible()
  })

  test("shows breadcrumb on clothing management sub-page", async ({ page }) => {
    const breadcrumb = new BreadcrumbPage(page)
    await page.goto("/clothing-management/types")

    await expect(breadcrumb.crumbLink("Klamotten Management")).toBeVisible()
    await expect(breadcrumb.crumb("Typen")).toBeVisible()
  })
})
