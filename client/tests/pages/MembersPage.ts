import type { Page } from "@playwright/test"

export class MembersPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/members")
  }

  async gotoNew() {
    await this.page.goto("/members/new")
  }

  async clickCreate() {
    await this.page.getByRole("button", { name: "Mitglied erstellen" }).click()
  }

  async fillName(name: string) {
    await this.page.locator("#name").fill(name)
  }

  async submitForm() {
    await this.page.getByRole("button", { name: "Speichern" }).click()
  }

  async confirmDuplicate() {
    await this.page.getByRole("button", { name: "Trotzdem erstellen" }).click()
  }

  async clickEditForMember(name: string) {
    await this.page
      .getByRole("link", { name: `Mitglied ${name} bearbeiten` })
      .click()
  }

  async fillSearch(searchTerm: string) {
    await this.page.getByPlaceholder("Mitglieder suchen...").fill(searchTerm)
  }

  duplicateWarning() {
    return this.page.getByRole("alertdialog")
  }

  memberRow(name: string) {
    return this.page.getByRole("row").filter({ hasText: name })
  }
}
