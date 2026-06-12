import type { Page } from "@playwright/test"

export class AdminSettingsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/admin/settings")
  }

  fileInput() {
    return this.page.locator('input[type="file"]')
  }

  uploadButton() {
    return this.page.getByRole("button", { name: "Hochladen" })
  }

  previewLink() {
    return this.page.getByRole("link", {
      name: "Datenschutzerklärung aufrufen",
    })
  }

  currentDocument() {
    return this.page.getByTestId("privacy-policy-current")
  }

  emptyState() {
    return this.page.getByTestId("privacy-policy-empty")
  }

  privacyPolicyDeleteButton() {
    return this.page
      .getByTestId("privacy-policy-current")
      .getByRole("button", { name: "Löschen" })
  }

  impressumDeleteButton() {
    return this.page
      .getByTestId("impressum-current")
      .getByRole("button", { name: "Löschen" })
  }

  dialogConfirmButton() {
    return this.page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Löschen" })
  }

  async selectFile(name: string, mimeType: string, contents: string) {
    await this.fileInput().setInputFiles({
      name,
      mimeType,
      buffer: Buffer.from(contents),
    })
  }

  async upload(name: string, mimeType: string, contents: string) {
    await this.selectFile(name, mimeType, contents)
    await this.uploadButton().click()
  }

  async deleteDocument() {
    await this.privacyPolicyDeleteButton().click()
    await this.dialogConfirmButton().click()
  }

  async deleteImpressum() {
    await this.impressumDeleteButton().click()
    await this.dialogConfirmButton().click()
  }

  async cleanupAll() {
    await this.goto()

    if ((await this.privacyPolicyDeleteButton().count()) > 0) {
      await this.privacyPolicyDeleteButton().click()
      await this.dialogConfirmButton().click()
      await this.emptyState().waitFor({ state: "visible" })
    }

    if ((await this.impressumDeleteButton().count()) > 0) {
      await this.impressumDeleteButton().click()
      await this.dialogConfirmButton().click()
      await this.page
        .getByTestId("impressum-empty")
        .waitFor({ state: "visible" })
    }
  }
}
