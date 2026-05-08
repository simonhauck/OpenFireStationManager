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
    await this.page.locator("#name").fill(name)
  }

  async submitCreate() {
    await this.page
      .getByRole("button", { name: "Kleidungstyp erstellen" })
      .click()
  }

  async submitEdit() {
    await this.page
      .getByRole("button", { name: "Aenderungen speichern" })
      .click()
  }

  async clickEditForType(name: string) {
    await this.page
      .getByRole("link", { name: `Kleidungstyp ${name} bearbeiten` })
      .click()
  }

  async clickDeleteForType(name: string) {
    await this.page
      .getByRole("button", { name: `Kleidungstyp ${name} löschen` })
      .click()
  }

  async confirmDelete() {
    await this.page.getByRole("button", { name: "Löschen" }).click()
  }

  async cancelDelete() {
    await this.page.getByRole("button", { name: "Abbrechen" }).click()
  }

  deleteDialogErrorMessage() {
    return this.page.getByText(
      "Dieser Kleidungstyp kann nicht gelöscht werden, da noch Kleidungsstücke diesem Typ zugeordnet sind.",
    )
  }

  typeRow(name: string) {
    return this.page.getByRole("row").filter({ hasText: name })
  }

  emptyState() {
    return this.page.getByText("Keine Kleidungstypen gefunden.")
  }
}
