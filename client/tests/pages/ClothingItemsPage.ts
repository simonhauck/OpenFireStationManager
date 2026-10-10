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
    const radio = this.page.getByRole("radio", { name: typeName })
    await radio.click()
    for (let attempt = 0; attempt < 4; attempt++) {
      if (await radio.isChecked()) return
      await radio.click()
    }
    throw new Error(`Kleidungstyp ${typeName} konnte nicht ausgewählt werden.`)
  }

  async fillSize(size: string) {
    await this.page
      .getByRole("textbox", { name: /^Größe( Erforderlich)?$/ })
      .fill(size)
  }

  async fillBarcode(barcode: string) {
    await this.page
      .getByRole("textbox", { name: "Barcode (optional)" })
      .fill(barcode)
  }

  async selectLocation(locationName: string) {
    const trigger = this.page.getByRole("combobox", {
      name: "Standort (optional)",
    })
    await trigger.click()
    // Wait until the option list contains the target location before using the
    // native typeahead: a location created after the locations query was cached
    // is otherwise silently missed.
    await this.page
      .getByRole("option", { name: locationName })
      .waitFor({ state: "attached" })
    await trigger.pressSequentially(locationName)
    await trigger.press("Enter")
  }

  async clearLocation() {
    await this.page
      .getByRole("button", { name: "Standort (optional) löschen" })
      .click()
  }

  async submitForm() {
    await this.page.getByRole("button", { name: "Speichern" }).click()
  }

  async clickEditForItem(id: string | number) {
    await this.page
      .getByRole("button", {
        name: `Kleidungsstueck ${id} bearbeiten`,
      })
      .click()
  }

  async clickDeleteForItem(id: string | number) {
    await this.page
      .getByRole("button", {
        name: `Kleidungsstueck ${id} löschen`,
      })
      .click()
  }

  async confirmDelete() {
    await this.page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Löschen" })
      .click()
  }

  itemRow(barcode: string) {
    return this.page.getByRole("row").filter({ hasText: barcode })
  }

  formErrorAlert() {
    return this.page.getByRole("alert")
  }

  // --- Batch import ---

  async selectBatchType(typeName: string) {
    await this.page.getByRole("radio", { name: typeName }).click()
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
