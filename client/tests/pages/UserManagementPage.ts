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
    await this.page
      .getByRole("textbox", { name: /^Benutzername( Erforderlich)?$/ })
      .fill(username)
  }

  async fillFirstName(firstName: string) {
    await this.page
      .getByRole("textbox", { name: /^Vorname( Erforderlich)?$/ })
      .fill(firstName)
  }

  async fillLastName(lastName: string) {
    await this.page
      .getByRole("textbox", { name: /^Nachname( Erforderlich)?$/ })
      .fill(lastName)
  }

  async fillPassword(password: string) {
    await this.page
      .getByRole("textbox", { name: /^Passwort( Erforderlich)?$/ })
      .fill(password)
  }

  async fillConfirmPassword(password: string) {
    await this.page
      .getByRole("textbox", { name: /^Passwort bestätigen( Erforderlich)?$/ })
      .fill(password)
  }

  async submitCreate() {
    await this.page.getByRole("button", { name: "Nutzer erstellen" }).click()
  }

  async submitEdit() {
    await this.page
      .getByRole("button", { name: "Änderungen speichern" })
      .click()
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
