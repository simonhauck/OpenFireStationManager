import type { Page } from "@playwright/test"

export class ClothingLocationDetailPage {
  constructor(private readonly page: Page) {}

  async goto(locationId: string | number) {
    await this.page.goto(`/clothing-management/locations/${locationId}`)
  }

  heading(name: string) {
    return this.page.getByRole("heading", { name, level: 1 })
  }

  detailsSection() {
    return this.page.getByTestId("section-Details")
  }

  memberLink(name: string) {
    return this.detailsSection().getByRole("link", { name, exact: true })
  }

  clothingSection() {
    return this.page.getByTestId("section-Kleidung")
  }

  itemRow(barcode: string) {
    return this.clothingSection().getByRole("row").filter({ hasText: barcode })
  }

  itemLink(barcode: string, label: string) {
    return this.itemRow(barcode).getByRole("link", {
      name: label,
      exact: true,
    })
  }

  async clickEdit() {
    await this.page
      .getByRole("button", { name: "Bearbeiten", exact: true })
      .click()
  }

  async clickDelete() {
    await this.page
      .getByRole("button", { name: "Löschen", exact: true })
      .click()
  }

  deleteDialog() {
    return this.page.getByRole("alertdialog")
  }

  async confirmDelete() {
    await this.deleteDialog().getByRole("button", { name: "Löschen" }).click()
  }
}
