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

    test("shows the phone number when configured", async ({ page }) => {
      const name = `Feuerwehr-${randomUUID().slice(0, 8)}`
      const phone = "+49 123 456789"
      const admin = new ImpressumAdminPage(page)
      const publicPage = new ImpressumPublicPage(page)

      await admin.goto()
      await admin.upsertImpressum({
        name,
        address: "Musterstraße 1\n12345 Musterstadt",
        email: "info@feuerwehr.de",
        phone,
      })

      await publicPage.goto()

      await expect(publicPage.phone(phone)).toBeVisible()
    })

    test("does not show the phone number when not configured", async ({
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

      await expect(publicPage.phone("+49 123 456789")).not.toBeVisible()
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

    test("deletes the impressum and shows the empty state", async ({
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

      await expect(admin.currentImpressum()).toBeVisible()
      await admin.deleteImpressum()

      await expect(admin.emptyState()).toBeVisible()
    })

    test("shows the empty state on /impressum when no impressum is configured", async ({
      page,
    }) => {
      // Previous test deleted the impressum — verify the public page reflects this
      const publicPage = new ImpressumPublicPage(page)

      await publicPage.goto()

      await expect(publicPage.emptyState()).toBeVisible()
    })
  })
