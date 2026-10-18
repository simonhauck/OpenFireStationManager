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
    await this.page.getByRole("link", { name: "Mitglied erstellen" }).click()
  }

  async fillName(name: string) {
    await this.page
      .getByRole("textbox", { name: /^Name( Erforderlich)?$/ })
      .fill(name)
  }

  async submitForm() {
    await this.page.getByRole("button", { name: "Speichern" }).click()
  }

  async clickEditForMember(name: string) {
    await this.page
      .getByRole("button", { name: `Mitglied ${name} bearbeiten` })
      .click()
  }

  async clickDeleteForMember(name: string) {
    await this.page
      .getByRole("button", { name: `Mitglied ${name} löschen` })
      .click()
  }

  async confirmDelete() {
    await this.deleteDialog().getByRole("button", { name: "Löschen" }).click()
  }

  deleteDialog() {
    return this.page.getByRole("alertdialog")
  }

  async clickMemberName(name: string) {
    await this.page.getByRole("link", { name, exact: true }).click()
  }

  memberRow(name: string) {
    return this.page.getByRole("row").filter({ hasText: name })
  }

  locationLink(memberName: string, locationName: string) {
    return this.memberRow(memberName).getByRole("link", {
      name: locationName,
      exact: true,
    })
  }
}
