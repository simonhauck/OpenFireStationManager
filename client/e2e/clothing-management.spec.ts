import { expect, test } from "@playwright/test"

import {
  TEST_KLEIDERWART_PASSWORD,
  TEST_KLEIDERWART_USERNAME,
  loginAs,
} from "./helpers/auth"

test.describe("Clothing Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_KLEIDERWART_USERNAME, TEST_KLEIDERWART_PASSWORD)
  })

  // -------------------------------------------------------------------------
  // Overview page
  // -------------------------------------------------------------------------

  test("shows the clothing management overview page", async ({ page }) => {
    await page.goto("/clothing-management")

    await expect(
      page.getByRole("heading", { name: "Klamottenmanagement" }),
    ).toBeVisible()

    await expect(page.getByText("Kleidungsstuecke")).toBeVisible()
    await expect(page.getByText("Kleidungstypen")).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Clothing Types
  // -------------------------------------------------------------------------

  test("shows the clothing types page", async ({ page }) => {
    await page.goto("/clothing-management/types")

    await expect(
      page.getByRole("heading", { name: "Klamottenmanagement" }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Kleidungstyp erstellen" }),
    ).toBeVisible()

    // Table header should be present
    await expect(page.getByRole("columnheader", { name: "Typ" })).toBeVisible()
  })

  test("creates a new clothing type and shows it in the list", async ({
    page,
  }) => {
    const typeName = `E2E-Typ-${Date.now()}`

    await page.goto("/clothing-management/types/new")

    await expect(
      page.getByRole("heading", { name: "Kleidungstyp erstellen" }),
    ).toBeVisible()

    await page.getByLabel("Bezeichnung").fill(typeName)
    await page.getByRole("button", { name: "Kleidungstyp erstellen" }).click()

    // Should redirect back to the types list
    await page.waitForURL("**/clothing-management/types")

    // The new type should be visible in the table
    await expect(page.getByRole("cell", { name: typeName })).toBeVisible()
  })

  test("navigates to edit clothing type page and saves changes", async ({
    page,
  }) => {
    // First ensure at least one type exists by creating one
    const typeName = `E2E-Edit-Typ-${Date.now()}`

    await page.goto("/clothing-management/types/new")
    await page.getByLabel("Bezeichnung").fill(typeName)
    await page.getByRole("button", { name: "Kleidungstyp erstellen" }).click()
    await page.waitForURL("**/clothing-management/types")

    // Click the edit button for the newly created type
    await page
      .getByRole("link", { name: `Kleidungstyp ${typeName} bearbeiten` })
      .click()

    await expect(
      page.getByRole("heading", { name: "Kleidungstyp bearbeiten" }),
    ).toBeVisible()

    const updatedName = `${typeName}-edited`
    const nameInput = page.getByLabel("Bezeichnung")
    await nameInput.fill(updatedName)

    await page.getByRole("button", { name: "Änderungen speichern" }).click()

    // Should redirect back to the types list
    await page.waitForURL("**/clothing-management/types")

    await expect(page.getByRole("cell", { name: updatedName })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Clothing Items
  // -------------------------------------------------------------------------

  test("shows the clothing items page", async ({ page }) => {
    await page.goto("/clothing-management/items")

    await expect(
      page.getByRole("heading", { name: "Klamottenmanagement" }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Massenimport" })).toBeVisible()
  })

  test("creates clothing items via batch import", async ({ page }) => {
    // Ensure a clothing type exists to import items for
    const typeName = `E2E-BatchTyp-${Date.now()}`

    await page.goto("/clothing-management/types/new")
    await page.getByLabel("Bezeichnung").fill(typeName)
    await page.getByRole("button", { name: "Kleidungstyp erstellen" }).click()
    await page.waitForURL("**/clothing-management/types")

    // Navigate to the batch import page
    await page.goto("/clothing-management/items/batch")

    await expect(
      page.getByRole("heading", { name: "Massenimport von Kleidungsstuecken" }),
    ).toBeVisible()

    // Select the clothing type we just created
    await page.getByLabel(typeName).click()

    // Enter CSV data
    const csvData = "L,BARCODE-E2E-001\nM,BARCODE-E2E-002"
    await page.getByPlaceholder(/L,BARCODE001/).fill(csvData)

    // Click preview
    await page.getByRole("button", { name: "Vorschau" }).click()

    // Preview should show 2 entries
    await expect(page.getByText("Vorschau (2 Eintraege)")).toBeVisible()

    // Submit the import
    await page.getByRole("button", { name: "Importieren" }).click()

    // Success message should appear
    await expect(
      page.getByText(/2 Kleidungsstueck\(e\) erfolgreich erstellt/),
    ).toBeVisible()

    // Navigate back to items overview
    await page.getByRole("button", { name: "Zur Uebersicht" }).click()
    await page.waitForURL("**/clothing-management/items")

    await expect(
      page.getByRole("heading", { name: "Klamottenmanagement" }),
    ).toBeVisible()
  })

  test("shows batch import page with step instructions", async ({ page }) => {
    await page.goto("/clothing-management/items/batch")

    await expect(
      page.getByText("Schritt 1: Kleidungstyp auswaehlen"),
    ).toBeVisible()
  })
})
