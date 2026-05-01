import type { Page } from "@playwright/test"

export class UserManagementPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/user-management")
  }

  async gotoNew() {
    await this.page.goto("/user-management/new")
  }

  createButton() {
    return this.page.getByRole("link", { name: "Nutzer erstellen" })
  }

  async fillUsername(username: string) {
    await this.page.locator("#username").fill(username)
  }

  async fillFirstName(firstName: string) {
    await this.page.locator("#firstName").fill(firstName)
  }

  async fillLastName(lastName: string) {
    await this.page.locator("#lastName").fill(lastName)
  }

  async fillPassword(password: string) {
    await this.page.locator("#password").fill(password)
  }

  async submitForm() {
    await this.page.getByRole("button", { name: "Speichern" }).click()
  }

  async clickEditForUser(username: string) {
    await this.page
      .getByRole("button", { name: `Nutzer ${username} bearbeiten` })
      .click()
  }

  userRow(username: string) {
    return this.page.getByRole("row").filter({ hasText: username })
  }
}
