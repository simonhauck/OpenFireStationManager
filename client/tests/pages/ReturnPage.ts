import type { Page } from "@playwright/test"

export class ReturnPage {
  constructor(private readonly page: Page) {}

  async goto(returnTarget: "WAESCHE" | "POOL" = "WAESCHE") {
    await this.page.goto(`/pool-clothing/return?returnTarget=${returnTarget}`)
  }

  async scanBarcode(barcode: string) {
    await this.page.click("body")
    await this.page.keyboard.type(barcode)
    await this.page.keyboard.press("Enter")
  }

  scannedItem(label: string) {
    return this.page.locator(".rounded-lg.border").filter({ hasText: label })
  }

  weiterButton() {
    return this.page.getByRole("button", { name: /Weiter/ })
  }

  tileGridItem(name: string) {
    return this.page.getByText(name, { exact: true }).first()
  }

  submitButton() {
    return this.page.getByRole("button", { name: /Bestätigen|Wird gesendet/ })
  }

  successHeading() {
    return this.page.getByText("Vorgang abgeschlossen")
  }
}
