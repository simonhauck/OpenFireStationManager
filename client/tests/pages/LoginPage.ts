import type { Page } from "@playwright/test"

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login")
  }

  async login(username: string, password: string) {
    await this.page.locator("#username").fill(username)
    await this.page.locator("#password").fill(password)
    await this.page.getByRole("button", { name: "Anmelden" }).click()
  }

  async logout() {
    // Navigate to any authenticated page first, then trigger logout via the header/menu
    await this.page.getByRole("button", { name: /abmelden/i }).click()
  }

  errorMessage() {
    return this.page.getByText(
      "Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.",
    )
  }

  loginButton() {
    return this.page.getByRole("button", { name: "Anmelden" })
  }
}
