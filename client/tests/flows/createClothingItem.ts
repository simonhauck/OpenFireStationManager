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
  await selectType(page, options.typeName)
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

async function selectType(page: Page, typeName: string): Promise<void> {
  const radio = page.getByRole("radio", { name: typeName })
  await radio.click()
  for (let attempt = 0; attempt < 4; attempt++) {
    if (await radio.isChecked()) return
    await radio.click()
  }
  throw new Error(`Kleidungstyp ${typeName} konnte nicht ausgewählt werden.`)
}
