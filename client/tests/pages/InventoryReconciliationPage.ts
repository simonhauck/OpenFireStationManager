import type { Page } from "@playwright/test"

export class InventoryReconciliationPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/pool-clothing/inventory-reconciliation")
  }

  // ─── Step 1: Standort wählen ────────────────────────────────────────────────

  async selectLocation(name: string) {
    await this.page.getByRole("combobox").click()
    await this.page.getByPlaceholder("Standort suchen...").fill(name)
    await this.page.getByRole("option", { name, exact: false }).first().click()
  }

  // ─── Step 2: Kleidung scannen ───────────────────────────────────────────────

  async scanBarcode(barcode: string) {
    await this.page.keyboard.type(barcode)
    await this.page.keyboard.press("Enter")
  }

  scannedItem(label: string) {
    return this.page.locator(".rounded-lg.border").filter({ hasText: label })
  }

  async clickWeiter() {
    await this.page.getByRole("button", { name: "Weiter →" }).click()
  }

  // ─── Step 3: Differenzen & Bestätigen ───────────────────────────────────────

  diffSection(title: string) {
    return this.page.getByText(title, { exact: true })
  }

  async submitReconciliation() {
    await this.page
      .getByRole("button", { name: "Inventarisierung abschließen" })
      .click()
  }

  warningBanner() {
    return this.page.getByText(
      'Fehlende Kleidung wird auf "Kein Standort" gesetzt',
    )
  }

  // ─── Step 4: Success ────────────────────────────────────────────────────────

  successHeading() {
    return this.page.getByText("Inventarisierung abgeschlossen")
  }

  navigateToOverviewButton() {
    return this.page.getByRole("button", { name: "Zur Übersicht" })
  }
}
