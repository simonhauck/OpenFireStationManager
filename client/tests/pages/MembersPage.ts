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

  async confirmDuplicate() {
    await this.page.getByRole("button", { name: "Trotzdem erstellen" }).click()
  }

  async clickEditForMember(name: string) {
    await this.page
      .getByRole("button", { name: `Mitglied ${name} bearbeiten` })
      .click()
  }

  async clickMemberName(name: string) {
    await this.page.getByRole("link", { name, exact: true }).click()
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

  locationChip(memberName: string, locationName: string) {
    return this.memberRow(memberName).getByRole("link", {
      name: locationName,
      exact: true,
    })
  }

  locationsCell(memberName: string) {
    return this.memberRow(memberName).getByRole("cell").nth(1)
  }
}
