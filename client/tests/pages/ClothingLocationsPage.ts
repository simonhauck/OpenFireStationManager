import type { Page } from "@playwright/test"

export class ClothingLocationsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/clothing-management/locations")
  }

  async gotoNew() {
    await this.page.goto("/clothing-management/locations/new")
  }

  async gotoBatchImport() {
    await this.page.goto("/clothing-management/locations/batch")
  }

  async openCreateDropdown() {
    await this.page.getByRole("button", { name: "Neuen Standort" }).click()
  }

  async clickCreateSingle() {
    await this.openCreateDropdown()
    await this.page.getByRole("menuitem", { name: "Einzeln erstellen" }).click()
  }

  async clickBatchImport() {
    await this.openCreateDropdown()
    await this.page.getByRole("menuitem", { name: "Massenimport" }).click()
  }

  async selectType(
    type: "POOL" | "WAESCHE" | "PERSONAL" | "OTHER",
  ) {
    await this.page.locator(`#type-${type}`).click()
  }

  async fillName(name: string) {
    await this.page.locator("#name").fill(name)
  }

  async fillComment(comment: string) {
    await this.page.locator("#comment").fill(comment)
  }

  async submitForm() {
    await this.page.getByRole("button", { name: "Speichern" }).click()
  }

  async clickEditForLocation(name: string) {
    await this.page
      .getByRole("button", { name: `Standort ${name} bearbeiten` })
      .click()
  }

  async clickDeleteForLocation(name: string) {
    await this.page
      .getByRole("button", { name: `Standort ${name} loeschen` })
      .click()
  }

  async confirmDelete() {
    await this.page.getByRole("button", { name: "Loeschen" }).click()
  }

  locationRow(name: string) {
    return this.page.getByRole("row").filter({ hasText: name })
  }

  // --- Batch import ---

  async selectBatchType(
    label: "Pool" | "Wäsche" | "Persönlicher Standort" | "Sonstiges",
  ) {
    await this.page.getByRole("combobox").click()
    await this.page.getByRole("option", { name: label }).click()
  }

  async fillBatchCsv(csv: string) {
    await this.page.getByRole("textbox").fill(csv)
  }

  async clickPreview() {
    await this.page.getByRole("button", { name: "Vorschau" }).click()
  }

  async clickImport() {
    await this.page.getByRole("button", { name: "Importieren" }).click()
  }

  successMessage() {
    return this.page.getByText(/erfolgreich erstellt/)
  }
}
