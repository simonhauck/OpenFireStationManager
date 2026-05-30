import { expect, test } from "@playwright/test"
import { randomUUID } from "node:crypto"
import { AdminSettingsPage } from "../pages/AdminSettingsPage"

test.use({ storageState: "playwright/.auth/admin.json" })

test.describe.serial("Admin Settings – Datenschutzerklärung", () => {
  test("uploads a privacy policy document and serves it publicly", async ({
    page,
  }) => {
    const fileName = `policy-${randomUUID().slice(0, 8)}.pdf`
    const adminSettings = new AdminSettingsPage(page)

    await adminSettings.goto()
    await adminSettings.upload(fileName, "application/pdf", "%PDF-1.4 e2e test")

    await expect(adminSettings.currentDocument()).toContainText(fileName)
    await expect(adminSettings.previewLink()).toBeVisible()

    const response = await page.request.get("/privacy-policy")
    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toContain("application/pdf")
  })

  test("deletes the privacy policy document and shows the empty state", async ({
    page,
  }) => {
    const fileName = `policy-${randomUUID().slice(0, 8)}.txt`
    const adminSettings = new AdminSettingsPage(page)

    await adminSettings.goto()
    await adminSettings.upload(fileName, "text/plain", "e2e delete test")
    await expect(adminSettings.currentDocument()).toContainText(fileName)

    await adminSettings.deleteDocument()

    await expect(adminSettings.emptyState()).toBeVisible()

    const response = await page.request.get("/privacy-policy")
    expect(response.status()).toBe(404)
  })
})
