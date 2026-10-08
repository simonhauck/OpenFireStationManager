import type { Page } from "@playwright/test"

export class MemberDetailPage {
  constructor(private readonly page: Page) {}

  async goto(memberId: string | number) {
    await this.page.goto(`/members/${memberId}`)
  }

  heading(name: string) {
    return this.page.getByRole("heading", { name, level: 1 })
  }

  metadata() {
    return this.page.getByTestId("member-metadata")
  }

  locationsSection() {
    return this.page.getByTestId("section-Standorte")
  }

  locationLink(name: string) {
    return this.locationsSection().getByRole("link", { name, exact: true })
  }

  locationEmptyState() {
    return this.locationsSection().getByText("Keine Standorte zugewiesen.")
  }

  clothingSection() {
    return this.page.getByTestId("section-Kleidung")
  }

  clothingGroup(locationName: string) {
    return this.clothingSection()
      .getByTestId("clothing-group")
      .filter({ hasText: locationName })
  }

  clothingEmptyState() {
    return this.clothingSection().getByText(
      "Keine Kleidung, da keine Standorte zugewiesen sind.",
    )
  }

  async clickDelete() {
    await this.page.getByRole("button", { name: "Löschen" }).click()
  }

  deleteDialog() {
    return this.page.getByRole("alertdialog")
  }

  async confirmDelete() {
    await this.deleteDialog().getByRole("button", { name: "Löschen" }).click()
  }
}
