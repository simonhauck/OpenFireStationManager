import type { Page } from "@playwright/test"
import { ClothingLocationsPage } from "../pages/ClothingLocationsPage"

export interface CreateLocationOptions {
  type: "POOL" | "WAESCHE" | "PERSONAL" | "OTHER"
  name: string
  comment?: string
}

/**
 * Creates a clothing location and returns to the list page.
 */
export async function createClothingLocation(
  page: Page,
  options: CreateLocationOptions,
): Promise<string> {
  const locationsPage = new ClothingLocationsPage(page)
  await locationsPage.gotoNew()
  await locationsPage.selectType(options.type)
  await locationsPage.fillName(options.name)
  if (options.comment) {
    await locationsPage.fillComment(options.comment)
  }
  await locationsPage.submitForm()
  await page.waitForURL("**/clothing-management/locations")
  return options.name
}
