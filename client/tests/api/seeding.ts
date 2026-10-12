import {
  type APIRequestContext,
  request as playwrightRequest,
} from "@playwright/test"
import type { components } from "../../src/api/schema"

export type ClothingType = components["schemas"]["ClothingType"]
export type ClothingLocation = components["schemas"]["ClothingLocation"]
export type ClothingItem = components["schemas"]["ClothingItem"]
export type Member = components["schemas"]["Member"]
export type LocationType =
  components["schemas"]["CreateClothingLocationRequest"]["type"]

const API_BASE_URL = process.env.E2E_API_URL ?? "http://localhost:8080"

export interface SeedLocationOptions {
  name: string
  type: LocationType
  comment?: string
  onlyVisibleForKleiderwart?: boolean
  memberId?: number
}

export interface SeedItemOptions {
  typeId: number
  size: string
  barcode?: string
  locationId?: number
}

export interface CheckoutScenario {
  runId: string
  type: ClothingType
  member: Member
  poolLocation: ClothingLocation
  personalLocation: ClothingLocation
  item: ClothingItem
}

/**
 * Creates a browser-less request context pointed at the backend.
 *
 * Use this for worker-scoped setup (e.g. inside `test.beforeAll`), where the test-scoped
 * `request` fixture is not available. Callers are responsible for disposing the context.
 */
export function createSeedRequest(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({ baseURL: API_BASE_URL })
}

async function seed<T>(
  request: APIRequestContext,
  path: string,
  data: unknown,
  label: string,
): Promise<T> {
  const response = await request.post(path, { data })
  if (!response.ok()) {
    throw new Error(
      `Failed to seed ${label}: ${response.status()} ${await response.text()}`,
    )
  }
  return (await response.json()) as T
}

/**
 * Seeds a clothing type through the test-profile `/api/test/clothing-types` endpoint.
 *
 * All helpers accept any {@link APIRequestContext} that reaches the backend — the test-scoped
 * `request` fixture (via the Vite proxy) or a context from {@link createSeedRequest} (directly).
 */
export function seedClothingType(
  request: APIRequestContext,
  name: string,
): Promise<ClothingType> {
  return seed<ClothingType>(
    request,
    "/api/test/clothing-types",
    { name },
    `type "${name}"`,
  )
}

/** Seeds a clothing location, optionally owned by a member (for `PERSONAL`). */
export function seedClothingLocation(
  request: APIRequestContext,
  options: SeedLocationOptions,
): Promise<ClothingLocation> {
  return seed<ClothingLocation>(
    request,
    "/api/test/clothing-locations",
    {
      name: options.name,
      comment: options.comment ?? "",
      onlyVisibleForKleiderwart: options.onlyVisibleForKleiderwart ?? false,
      type: options.type,
      memberId: options.memberId,
    },
    `location "${options.name}"`,
  )
}

/**
 * Seeds a clothing item. When `locationId` is given, the initial-placement movement is recorded
 * exactly as the production endpoint does.
 */
export function seedClothingItem(
  request: APIRequestContext,
  options: SeedItemOptions,
): Promise<ClothingItem> {
  return seed<ClothingItem>(
    request,
    "/api/test/clothing-items",
    {
      typeId: options.typeId,
      size: options.size,
      barcode: options.barcode,
      locationId: options.locationId,
    },
    `item (type ${options.typeId}, size ${options.size})`,
  )
}

/** Seeds a member. */
export function seedMember(
  request: APIRequestContext,
  name: string,
): Promise<Member> {
  return seed<Member>(
    request,
    "/api/test/members",
    { name },
    `member "${name}"`,
  )
}

/**
 * Seeds a full checkout-like scenario in a handful of request calls: a type, a member, a pool
 * location holding one item of that type, and a personal location owned by the member.
 */
export async function seedCheckoutScenario(
  request: APIRequestContext,
  runId: string,
): Promise<CheckoutScenario> {
  const type = await seedClothingType(request, `Typ-${runId}`)
  const member = await seedMember(request, `Mitglied-${runId}`)
  const poolLocation = await seedClothingLocation(request, {
    name: `Pool-${runId}`,
    type: "POOL",
  })
  const personalLocation = await seedClothingLocation(request, {
    name: `Spind-${runId}`,
    type: "PERSONAL",
    memberId: member.id,
  })
  const item = await seedClothingItem(request, {
    typeId: type.id,
    size: "52",
    barcode: `seed-${runId}`,
    locationId: poolLocation.id,
  })
  return { runId, type, member, poolLocation, personalLocation, item }
}
