import type { Page } from "@playwright/test"

export class ClothingItemsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/clothing-management/items")
  }

  async gotoNew() {
    await this.page.goto("/clothing-management/items/new")
  }

  async gotoBatchImport() {
    await this.page.goto("/clothing-management/items/batch")
  }

  async openCreateDropdown() {
    await this.page
      .getByRole("button", { name: "Neues Kleidungsstueck" })
      .click()
  }

  async clickCreateSingle() {
    await this.openCreateDropdown()
    await this.page.getByRole("menuitem", { name: "Einzeln erstellen" }).click()
  }

  async clickBatchImport() {
    await this.openCreateDropdown()
    await this.page.getByRole("menuitem", { name: "Massenimport" }).click()
  }

  async selectType(typeName: string) {
    await this.page.getByLabel(typeName).click()
  }

  async fillSize(size: string) {
    await this.page.locator("#size").fill(size)
  }

  async fillBarcode(barcode: string) {
    await this.page.locator("#barcode").fill(barcode)
  }

  async selectLocation(locationName: string) {
    await this.page.locator("#location").click()
    await this.page.getByRole("option", { name: locationName }).click()
  }

  async clearLocation() {
    await this.page
      .getByRole("button", { name: "Auswahl zurücksetzen" })
      .click()
  }

  async submitForm() {
    await this.page.getByRole("button", { name: "Speichern" }).click()
  }

  async clickEditForItem(id: string | number) {
    await this.page
      .getByRole("link", {
        name: `Kleidungsstueck ${id} bearbeiten`,
      })
      .click()
  }

  async clickDeleteForItem(id: string | number) {
    await this.page
      .getByRole("button", {
        name: `Kleidungsstueck ${id} loeschen`,
      })
      .click()
  }

  async confirmDelete() {
    await this.page.getByRole("button", { name: "Loeschen" }).click()
  }

  itemRow(barcode: string) {
    return this.page.getByRole("row").filter({ hasText: barcode })
  }

  // --- Batch import ---

  async selectBatchType(typeName: string) {
    await this.page.getByLabel(typeName).click()
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
