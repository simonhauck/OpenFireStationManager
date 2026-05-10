import type { Page } from "@playwright/test"

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/pool-clothing/checkout")
  }

  // ─── Step 1: Spind wählen ───────────────────────────────────────────────────

  /** Opens the PERSONAL location combobox and picks the option matching `name`. */
  async selectPersonalLocation(name: string) {
    await this.page.getByRole("combobox").click()
    await this.page.getByPlaceholder("Spind suchen...").fill(name)
    await this.page.getByRole("option", { name }).click()
  }

  // ─── Step 2: Kleidung scannen ───────────────────────────────────────────────

  async scanBarcode(barcode: string) {
    await this.page.keyboard.type(barcode)
    await this.page.keyboard.press("Enter")
  }

  /** The list entry for a scanned item (matched by type+size label). */
  scannedItem(label: string) {
    return this.page.locator(".rounded-lg.border").filter({ hasText: label })
  }

  async clickWeiter() {
    await this.page.getByRole("button", { name: "Weiter →" }).click()
  }

  // ─── Step 3: Rückgabe wählen ────────────────────────────────────────────────

  /** Proceeds past the return step without selecting any returns. */
  async confirmReturns() {
    await this.page.getByRole("button", { name: "Weiter →" }).click()
  }

  // ─── Step 5: Überprüfen ─────────────────────────────────────────────────────

  async submitCheckout() {
    await this.page.getByRole("button", { name: "Bestätigen" }).click()
  }

  // ─── Step 6: Success ────────────────────────────────────────────────────────

  successHeading() {
    return this.page.getByText("Vorgang abgeschlossen")
  }

  navigateToOverviewButton() {
    return this.page.getByRole("button", { name: "Zur Übersicht" })
  }
}
