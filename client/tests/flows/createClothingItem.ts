import type { Page } from "@playwright/test"
import { ClothingItemsPage } from "../pages/ClothingItemsPage"

export interface CreateItemOptions {
  typeName: string
  size: string
  barcode?: string
  /** Name of the location to assign the item to. Must already exist. */
  locationName?: string
}

/**
 * Creates a clothing item and returns to the list page.
 */
export async function createClothingItem(
  page: Page,
  options: CreateItemOptions,
): Promise<void> {
  const itemsPage = new ClothingItemsPage(page)
  await itemsPage.gotoNew()
  await itemsPage.selectType(options.typeName)
  await itemsPage.fillSize(options.size)
  if (options.barcode) {
    await itemsPage.fillBarcode(options.barcode)
  }
  if (options.locationName) {
    await itemsPage.selectLocation(options.locationName)
  }
  await itemsPage.submitForm()
  await page.waitForURL("**/clothing-management/items")
}
