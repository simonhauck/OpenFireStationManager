import type { Page } from "@playwright/test"

export class ImpressumAdminPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/admin/settings")
  }

  // --- Section state locators ---

  currentImpressum() {
    return this.page.getByTestId("impressum-current")
  }

  emptyState() {
    return this.page.getByTestId("impressum-empty")
  }

  // --- Open dialog buttons ---

  createButton() {
    return this.page.getByRole("button", { name: "Impressum erstellen" })
  }

  editButton() {
    return this.page.getByRole("button", { name: "Bearbeiten" })
  }

  deleteButton() {
    return this.page
      .getByTestId("impressum-current")
      .getByRole("button", { name: "Löschen" })
  }

  confirmDeleteButton() {
    return this.page.getByRole("button", { name: "Löschen" })
  }

  // --- Dialog form locators ---

  nameInput() {
    return this.page.locator("#impressum-name")
  }

  addressInput() {
    return this.page.locator("#impressum-address")
  }

  emailInput() {
    return this.page.locator("#impressum-email")
  }

  phoneInput() {
    return this.page.locator("#impressum-phone")
  }

  saveButton() {
    return this.page.getByRole("button", { name: "Speichern" })
  }

  cancelButton() {
    return this.page.getByRole("button", { name: "Abbrechen" })
  }

  // --- Actions ---

  async openCreateDialog() {
    await this.createButton().click()
  }

  async openEditDialog() {
    await this.editButton().click()
  }

  async fillForm(options: {
    name: string
    address: string
    email: string
    phone?: string
  }) {
    await this.nameInput().fill(options.name)
    await this.addressInput().fill(options.address)
    await this.emailInput().fill(options.email)
    if (options.phone !== undefined) {
      await this.phoneInput().fill(options.phone)
    }
  }

  async save() {
    await this.saveButton().click()
  }

  async upsertImpressum(options: {
    name: string
    address: string
    email: string
    phone?: string
  }) {
    // Wait for the section to finish loading before checking state
    await this.currentImpressum()
      .or(this.emptyState())
      .waitFor({ state: "visible" })
    const hasExisting = await this.currentImpressum().isVisible()
    if (hasExisting) {
      await this.openEditDialog()
    } else {
      await this.openCreateDialog()
    }
    await this.fillForm(options)
    await this.save()
  }

  async deleteImpressum() {
    await this.deleteButton().click()
    await this.confirmDeleteButton().click()
  }
}

export class ImpressumPublicPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/impressum")
  }

  emptyState() {
    return this.page.getByText("Kein Impressum vorhanden.")
  }

  name(value: string) {
    return this.page.getByText(value, { exact: true })
  }

  phone(value: string) {
    return this.page.getByText(value, { exact: true })
  }
}
