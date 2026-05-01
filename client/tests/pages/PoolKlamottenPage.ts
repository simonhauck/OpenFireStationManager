import type { Page } from "@playwright/test"

export class PoolKlamottenPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/pool-klamotten")
  }

  loadingIndicator() {
    return this.page.getByText("Uebersicht wird geladen...")
  }

  emptyState() {
    return this.page.getByText(
      "Es sind keine Standorte fuer die Anzeige konfiguriert.",
    )
  }

  errorState() {
    return this.page.getByText("Uebersicht konnte nicht geladen werden.")
  }
}
