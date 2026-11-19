import type { Page } from "@playwright/test"

/** The login form of the local Keycloak (realm `ofsm`), outside the application. */
export class KeycloakLoginPage {
  constructor(private readonly page: Page) {}

  usernameInput() {
    return this.page.locator("#username")
  }

  async login(username: string, password: string) {
    await this.usernameInput().fill(username)
    await this.page.locator("#password").fill(password)
    await this.page.locator("#kc-login").click()
  }
}
