import type { Page } from "@playwright/test"

export class BreadcrumbPage {
  constructor(private readonly page: Page) {}

  breadcrumb() {
    return this.page.getByRole("navigation", { name: "Breadcrumb" })
  }

  crumb(name: string) {
    return this.breadcrumb().getByText(name)
  }

  crumbLink(name: string) {
    return this.breadcrumb().getByRole("link", { name })
  }

  homeLink() {
    return this.breadcrumb().getByRole("link", { name: "Startseite" })
  }
}
