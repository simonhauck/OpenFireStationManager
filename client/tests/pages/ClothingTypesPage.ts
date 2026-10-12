import type { Page } from "@playwright/test"

export class ClothingTypesPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/clothing-management/types")
  }

  async gotoNew() {
    await this.page.goto("/clothing-management/types/new")
  }

  createButton() {
    return this.page.getByRole("link", { name: "Kleidungstyp erstellen" })
  }

  async fillForm(name: string) {
    await this.page
      .getByRole("textbox", { name: /^Bezeichnung( Erforderlich)?$/ })
      .fill(name)
  }

  async submitCreate() {
    await this.page
      .getByRole("button", { name: "Kleidungstyp erstellen" })
      .click()
  }

  async submitEdit() {
    await this.page
      .getByRole("button", { name: "Änderungen speichern" })
      .click()
  }

  async clickEditForType(name: string) {
    await this.page
      .getByRole("button", { name: `Kleidungstyp ${name} bearbeiten` })
      .click()
  }

  async clickDeleteForType(name: string) {
    await this.page
      .getByRole("button", { name: `Kleidungstyp ${name} löschen` })
      .click()
  }

  async confirmDelete() {
    await this.deleteDialog().getByRole("button", { name: "Löschen" }).click()
  }

  deleteDialog() {
    return this.page.getByRole("alertdialog")
  }

  deleteDialogErrorMessage() {
    return this.deleteDialog().getByText(
      "Dieser Kleidungstyp kann nicht gelöscht werden, da noch Kleidungsstücke diesem Typ zugeordnet sind.",
    )
  }

  typeRow(name: string) {
    return this.page.getByRole("row").filter({ hasText: name })
  }

  async selectImages(files: string[]) {
    await this.page.locator('input[type="file"]').setInputFiles(files)
  }

  async uploadSelectedImage() {
    await this.page.getByRole("button", { name: "Bild hochladen" }).click()
  }

  typeImageThumbnails() {
    return this.page.getByTestId("clothing-type-images").locator("img")
  }

  emptyState() {
    return this.page.getByText("Keine Kleidungstypen gefunden.")
  }
}
