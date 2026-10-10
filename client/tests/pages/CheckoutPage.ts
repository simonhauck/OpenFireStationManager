import type { Page } from "@playwright/test"

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/pool-clothing/checkout")
  }

  // ─── Step 1: Spind wählen ───────────────────────────────────────────────────

  /** Opens the PERSONAL location selector and picks the option matching `name`. */
  async selectPersonalLocation(name: string) {
    await this.page.getByRole("button", { name: "Spind", exact: true }).click()
    await this.page.getByPlaceholder("Spind suchen...").fill(name)
    await this.page.getByRole("option", { name }).click()
  }

  // ─── Step 2: Kleidung scannen (Ausgabe / Rückgabe) ──────────────────────────

  async scanBarcode(barcode: string) {
    await this.page.keyboard.type(barcode)
    await this.page.keyboard.press("Enter")
  }

  /** The left column: items that will be issued (taken). */
  ausgabeColumn() {
    return this.page.getByTestId("checkout-ausgabe")
  }

  /** The right column: locker contents and selected returns. */
  rueckgabeColumn() {
    return this.page.getByTestId("checkout-rueckgabe")
  }

  /** The row for a take item in the Ausgabe column, matched by type+size label. */
  ausgabeRow(label: string) {
    return this.ausgabeColumn()
      .locator(".rounded-lg.border")
      .filter({ hasText: label })
  }

  /** The checkbox for a row in the Rückgabe column, matched by type+size label. */
  rueckgabeCheckbox(label: string) {
    return this.rueckgabeColumn().getByRole("checkbox", { name: label })
  }

  /** The row for a forced return in the Rückgabe column, matched by type+size label. */
  rueckgabeRow(label: string) {
    return this.rueckgabeColumn()
      .locator(".rounded-lg.border")
      .filter({ hasText: label })
  }

  /** Moves the given Ausgabe row into the Rückgabe selection. */
  async moveToReturn(label: string) {
    await this.ausgabeRow(label)
      .getByRole("button", { name: /zur Rückgabe verschieben/ })
      .click()
  }

  /** Moves a forced return from the Rückgabe column back to Ausgabe. */
  async moveToAusgabe(label: string) {
    await this.rueckgabeRow(label)
      .getByRole("button", { name: /zur Ausgabe verschieben/ })
      .click()
  }

  /** Removes a taken item of `typeName` from the Ausgabe column. */
  async removeTake(typeName: string) {
    await this.ausgabeColumn()
      .getByRole("button", { name: `${typeName} entfernen` })
      .click()
  }

  /** Always-visible "where do I find the barcode?" gallery on the scanner step. */
  barcodeGallery() {
    return this.page.getByTestId("barcode-images-gallery")
  }

  async clickWeiter() {
    await this.page.getByRole("button", { name: "Weiter →" }).click()
  }

  // ─── Step 4: Überprüfen ─────────────────────────────────────────────────────

  async submitCheckout() {
    await this.page.getByRole("button", { name: "Bestätigen" }).click()
  }

  // ─── Step 5: Success ────────────────────────────────────────────────────────

  successHeading() {
    return this.page.getByText("Vorgang abgeschlossen")
  }

  navigateToOverviewButton() {
    return this.page.getByRole("button", { name: "Zur Übersicht" })
  }
}
