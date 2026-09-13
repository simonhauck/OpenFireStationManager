import type { Page } from "@playwright/test"
import { MembersPage } from "../pages/MembersPage"

export async function createMember(page: Page, name: string): Promise<string> {
  const membersPage = new MembersPage(page)
  await membersPage.gotoNew()
  await membersPage.fillName(name)
  await membersPage.submitForm()
  await page.waitForURL("**/members")
  return name
}
