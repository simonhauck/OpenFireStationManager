import type { Page } from "@playwright/test"

export class RelocationPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/pool-klamotten/relocation")
  }

  // ─── Step 1: Ziel wählen ────────────────────────────────────────────────────

  /** Opens the location combobox and picks the option matching `name`. */
  async selectTargetLocation(name: string) {
    await this.page.getByRole("combobox").click()
    await this.page.getByPlaceholder("Standort suchen...").fill(name)
    await this.page.getByRole("option", { name, exact: false }).first().click()
  }

  // ─── Step 2: Kleidung scannen ───────────────────────────────────────────────

  /** Types a barcode into the barcode input and presses Enter to confirm. */
  async scanBarcode(barcode: string) {
    const input = this.page.getByPlaceholder(
      "Barcode eingeben / Scanner verwenden...",
    )
    await input.fill(barcode)
    await input.press("Enter")
  }

  /** The list entry for a scanned item (matched by type+size label). */
  scannedItem(label: string) {
    return this.page.locator(".rounded-lg.border").filter({ hasText: label })
  }

  async clickWeiter() {
    await this.page.getByRole("button", { name: "Weiter →" }).click()
  }

  // ─── Step 3: Überprüfen ─────────────────────────────────────────────────────

  async submitRelocation() {
    await this.page.getByRole("button", { name: "Bestätigen" }).click()
  }

  // ─── Step 4: Success ────────────────────────────────────────────────────────

  successHeading() {
    return this.page.getByText("Umlagerung abgeschlossen")
  }

  navigateToOverviewButton() {
    return this.page.getByRole("button", { name: "Zur Übersicht" })
  }

  // ─── Pool Klamotten entry point ─────────────────────────────────────────────

  umlagerungButton(page: Page) {
    return page.getByRole("link", { name: "Umlagerung starten" })
  }
}
