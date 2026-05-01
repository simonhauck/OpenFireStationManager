import type { Page } from "@playwright/test"
import { ClothingTypesPage } from "../pages/ClothingTypesPage"

/**
 * Creates a clothing type and returns to the list page.
 * Returns the name used so the caller can reference it.
 */
export async function createClothingType(
  page: Page,
  name: string,
): Promise<string> {
  const typesPage = new ClothingTypesPage(page)
  await typesPage.gotoNew()
  await typesPage.fillForm(name)
  await typesPage.submitCreate()
  // Wait for redirect back to list
  await page.waitForURL("**/clothing-management/types")
  return name
}
