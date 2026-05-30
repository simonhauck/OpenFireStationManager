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
    return this.page.getByRole("link", { name: "Datenschutzerklärung aufrufen" })
  }

  currentDocument() {
    return this.page.getByTestId("privacy-policy-current")
  }

  emptyState() {
    return this.page.getByTestId("privacy-policy-empty")
  }

  deleteButton() {
    return this.page.getByRole("button", { name: "Löschen" })
  }

  confirmDeleteButton() {
    return this.page.getByRole("button", { name: "Löschen" })
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
    await this.deleteButton().click()
    await this.confirmDeleteButton().click()
  }
}
