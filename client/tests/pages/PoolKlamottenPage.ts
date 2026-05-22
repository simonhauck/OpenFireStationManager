import type { Page } from "@playwright/test"

export class PoolKlamottenPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/pool-clothing")
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

  /**
   * Returns a locator scoped to the PageSubSection for the given pool location.
   * Use this to assert presence/absence of content within a specific location,
   * avoiding false matches from other locations accumulated in the shared DB.
   */
  locationSection(locationName: string) {
    return this.page.getByTestId(`section-${locationName}`)
  }

  /**
   * Returns a locator for the type panel header within a given pool location section.
   * The header renders `typeName (count)` via LabelWithCount — use this to assert
   * the count after a checkout, e.g. `.getByText("(0)")`.
   */
  typePanel(locationName: string, typeName: string) {
    return this.locationSection(locationName).locator("p", { hasText: typeName })
  }
}
