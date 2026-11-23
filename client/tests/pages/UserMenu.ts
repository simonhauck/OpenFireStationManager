import type { Page } from "@playwright/test"

/** The sign-in button and the user menu in the header. */
export class UserMenu {
  constructor(private readonly page: Page) {}

  signInButton() {
    return this.page.getByText("Anmelden", { exact: true })
  }

  async logout() {
    // The avatar announces itself either via aria-label or via its image alt text.
    await this.page
      .getByLabel(/^Benutzermenü für/)
      .or(this.page.getByAltText(/^Benutzermenü für/))
      .first()
      .click()
    await this.page.getByRole("menuitem", { name: "Abmelden" }).click()
  }
}
