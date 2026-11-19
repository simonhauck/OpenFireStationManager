import { expect, type Page, test } from "@playwright/test"
import { KeycloakLoginPage } from "../pages/KeycloakLoginPage"
import { PoolKlamottenPage } from "../pages/PoolKlamottenPage"
import { UserMenu } from "../pages/UserMenu"

// These tests sign in at the real local Keycloak (realm `ofsm`, demo user admin/admin), so they
// start without a stored session. Every other spec uses the personas from global-setup.ts.
//
// Removed with the switch to OpenID Connect: "shows error message on invalid credentials" is
// consciously dropped, because the provider owns the login form and its error messages.

const KEYCLOAK_URL = /^http:\/\/localhost:8180\/realms\/ofsm\//
const LOGIN_PAGE = /^http:\/\/localhost:3000\/login(\?|$)/
// /pool-clothing/checkout is guarded by RoleGuard with allowedRoles=["USER"]; ADMIN holds it.
const protectedRoute = "/pool-clothing/checkout"

async function signInAtKeycloak(page: Page) {
  const keycloak = new KeycloakLoginPage(page)
  await expect(page).toHaveURL(KEYCLOAK_URL)
  await keycloak.login("admin", "admin")
}

test.describe("Auth", () => {
  test("signing in returns to the requested page without the login page in history", async ({
    page,
  }) => {
    const visited: string[] = []
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) visited.push(frame.url())
    })

    await page.goto(protectedRoute)
    await signInAtKeycloak(page)

    await expect(page).toHaveURL(/\/pool-clothing\/checkout$/)
    await expect(page.getByRole("button", { name: "Abbrechen" })).toBeVisible()
    const loginPageVisits = visited.filter((url) => LOGIN_PAGE.test(url))
    expect(loginPageVisits).toEqual([])
  })

  test("logout ends the provider session and returns to the start page", async ({
    page,
  }) => {
    await page.goto("/dashboard")
    await signInAtKeycloak(page)
    await expect(page).toHaveURL(/\/dashboard$/)

    await new UserMenu(page).logout()

    await expect(page).toHaveURL("http://localhost:3000/")
    await expect(new UserMenu(page).signInButton()).toBeVisible()

    // The provider session is gone too, so the login form shows again.
    await page.goto(protectedRoute)
    await expect(page).toHaveURL(KEYCLOAK_URL)
    await expect(new KeycloakLoginPage(page).usernameInput()).toBeVisible()
  })

  test("an expired session signs in again before the checkout wizard starts", async ({
    page,
    context,
  }) => {
    const overview = new PoolKlamottenPage(page)
    await overview.goto()
    await signInAtKeycloak(page)
    await expect(page).toHaveURL(/\/pool-clothing$/)
    await expect(overview.checkoutButton()).toBeVisible()

    // Expire the OFSM session while the overview stays open; the Keycloak session stays valid.
    await context.clearCookies({ name: "OFSM_AUTH" })

    await overview.checkoutButton().click()

    // The renewal goes through the provider without a password prompt.
    await expect(page).toHaveURL(/\/pool-clothing\/checkout$/)
    await expect(page.getByRole("button", { name: "Abbrechen" })).toBeVisible()
  })
})
