import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { ImpressumAdminPage, ImpressumPublicPage } from "../pages/ImpressumPage"

test.use({ storageState: "playwright/.auth/admin.json" })

test.describe
  .serial("Impressum", () => {
    test("creates an impressum and shows it on the admin page", async ({
      page,
    }) => {
      const name = `Feuerwehr-${randomUUID().slice(0, 8)}`
      const admin = new ImpressumAdminPage(page)

      await admin.goto()
      await admin.upsertImpressum({
        name,
        address: "Musterstraße 1\n12345 Musterstadt",
        email: "info@feuerwehr.de",
      })

      await expect(admin.currentImpressum()).toContainText(name)
      await expect(admin.currentImpressum()).toContainText("info@feuerwehr.de")
    })

    test("shows the impressum on the public /impressum page", async ({
      page,
    }) => {
      const name = `Feuerwehr-${randomUUID().slice(0, 8)}`
      const admin = new ImpressumAdminPage(page)
      const publicPage = new ImpressumPublicPage(page)

      await admin.goto()
      await admin.upsertImpressum({
        name,
        address: "Musterstraße 1\n12345 Musterstadt",
        email: "info@feuerwehr.de",
      })

      await publicPage.goto()

      await expect(publicPage.name(name)).toBeVisible()
    })

    test("edits an existing impressum", async ({ page }) => {
      const originalName = `Feuerwehr-${randomUUID().slice(0, 8)}`
      const updatedName = `Feuerwehr-${randomUUID().slice(0, 8)}`
      const admin = new ImpressumAdminPage(page)

      await admin.goto()
      await admin.upsertImpressum({
        name: originalName,
        address: "Musterstraße 1\n12345 Musterstadt",
        email: "info@feuerwehr.de",
      })

      await admin.openEditDialog()
      await admin.nameInput().fill(updatedName)
      await admin.save()

      await expect(admin.currentImpressum()).toContainText(updatedName)
      await expect(admin.currentImpressum()).not.toContainText(originalName)
    })
  })
