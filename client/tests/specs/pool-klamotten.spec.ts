import { expect, test } from "@playwright/test"
import { PoolKlamottenPage } from "../pages/PoolKlamottenPage"

test.use({ storageState: "playwright/.auth/user.json" })

test.describe("Pool Klamotten Dashboard", () => {
  test("loads the dashboard without errors", async ({ page }) => {
    const poolPage = new PoolKlamottenPage(page)
    await poolPage.goto()

    // Loading indicator should disappear
    await expect(poolPage.loadingIndicator()).not.toBeVisible()
    // No error state
    await expect(poolPage.errorState()).not.toBeVisible()
    // Page action button is visible
    await expect(
      page.getByRole("link", { name: "Klamotten tauschen" }),
    ).toBeVisible()
  })
})
