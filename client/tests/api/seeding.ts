import {
  type APIRequestContext,
  request as playwrightRequest,
} from "@playwright/test"
import type { components } from "../../src/api/schema"

export type ClothingType = components["schemas"]["ClothingType"]

const API_BASE_URL = process.env.E2E_API_URL ?? "http://localhost:8080"

/**
 * Creates a browser-less request context pointed at the backend.
 *
 * Use this for worker-scoped setup (e.g. inside `test.beforeAll`), where the test-scoped
 * `request` fixture is not available. Callers are responsible for disposing the context.
 */
export function createSeedRequest(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({ baseURL: API_BASE_URL })
}

/**
 * Seeds a clothing type through the test-profile `/api/test/clothing-types` endpoint.
 *
 * Accepts any {@link APIRequestContext} that reaches the backend — the test-scoped `request`
 * fixture (via the Vite proxy) or a context from {@link createSeedRequest} (directly).
 */
export async function seedClothingType(
  request: APIRequestContext,
  name: string,
): Promise<ClothingType> {
  const response = await request.post("/api/test/clothing-types", {
    data: { name },
  })
  if (!response.ok()) {
    throw new Error(
      `Failed to seed clothing type "${name}": ${response.status()} ${await response.text()}`,
    )
  }
  return (await response.json()) as ClothingType
}
