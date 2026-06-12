# Server Glossary

Domain language for the Spring Boot / Kotlin backend.

## Terms

### ClothingLocation

A physical place where clothing items can be stored. Every `ClothingItem` has at most one `locationId` (nullable). Locations have a `name` (required) and an optional `comment` for additional context (e.g. the assigned person's name). Locations are categorised by their `type`:

- **POOL** — shared stock that firefighters can take items *from*. Shown on the dashboard.
- **WAESCHE** — laundry. Items can be returned *to* it but never taken *from* it. Shown on the dashboard.
- **PERSONAL** — assigned to one individual (e.g. "Locker 1"). Not currently linked to a `UserAccount` row; the link may be added later. Hidden from the dashboard.
- **OTHER** — anything else (storage, lost & found, archive). Invisible to checkout and to the dashboard.

The `type` replaces the older `shouldBeShownOnDashboard` boolean: dashboard visibility is now derived from type (POOL + WAESCHE).

`onlyVisibleForKleiderwart` remains and is orthogonal to type — any location can be restricted to the Kleiderwart role.

### Kleiderwart

The clothing officer role (`UserRole.KLEIDERWART`). Manages clothing types, items, and locations. Distinct from `ADMIN` and `USER`.

### ClothingItemResolver

Owns all read access to `resolved_clothing_item_view`, a PostgreSQL view that left-joins `clothing_items`, `clothing_locations`, and `clothing_types` into a single denormalised row per item. Queried via `JdbcTemplate` + custom `RowMapper` that hydrates the nested `ResolvedClothingItem` DTO. Three methods: `resolveOne(id)`, `resolveAll()`, `resolveByBarcode(barcode)`. See ADR-0006.

### ClothingMovement

An append-only record of an item moving from one location to another (or being assigned a location for the first time). One row per item per move. Reasons: `CHECKOUT` (POOL → PERSONAL), `RETURN` (PERSONAL → WAESCHE), `MANUAL_CORRECTION` (Kleiderwart edits), `INITIAL_PLACEMENT` (item created with a location), `RELOCATION` (Kleiderwart bulk move to any location type). Movements created by the same batch operation share a `batchId`. See ADR-0001.

### Checkout

A user-facing action that produces one or more `ClothingMovement` rows in a single batch and atomic transaction via `POST /api/clothing/checkouts`. The Checkout itself is not a persisted aggregate — it is the API operation that writes the movements.

Three flows use this endpoint:

1. **Tauschen (exchange):** Take items from any location to a PERSONAL target, optionally return items from PERSONAL locations to a WAESCHE target. `targetLocationId` is required and must be PERSONAL.
2. **Rückgabe — Wäsche (return to laundry):** Return items from PERSONAL locations to a WAESCHE target. No take items. `targetLocationId` is null.
3. **Rückgabe — Pool (return to pool):** Return items from PERSONAL locations to a POOL target. No take items. `targetLocationId` is null.

The `returnLocationId` accepts WAESCHE or POOL. Return items may originate from different PERSONAL locations (no same-location constraint). Movement reasons: `CHECKOUT` for take items, `RETURN` for return items.

Validation: target must be PERSONAL when set; return target must be WAESCHE or POOL when set; take and return cannot both be empty; duplicate items across take/return rejected.

Any authenticated user may perform a Checkout. Discrepancy handling for taken items (warning when a scanned item is not at a POOL location) is a client-side UX concern only.

### Item lookup endpoints

Two purpose-built endpoints serve the Checkout flow's item picker:

- `GET /api/clothing/items/by-barcode/{barcode}` — strict-equality lookup for the HID barcode scanner. Returns a `ResolvedClothingItem` DTO carrying the item plus its current location's name and type. 404 when the barcode is unknown **or** when the requesting user is not Kleiderwart and the item is at an `onlyVisibleForKleiderwart` location (the two cases are intentionally indistinguishable to clients; logs record the real reason).
- `GET /api/clothing/items/search?q=<text>&limit=<n>` — fuzzy typeahead for the Combobox backup. Matches type name, size, and barcode (case-insensitive contains, any field). Hard-capped result count, no pagination. Items at `onlyVisibleForKleiderwart` locations are filtered out for non-Kleiderwart callers.

### Umlagerung (Relocation)

A Kleiderwart-only batch operation that moves one or more clothing items to any target location regardless of location type. Unlike Checkout, there is no discrepancy protocol — the source location is inferred per item from its current `locationId` in the database. All movements are written atomically in a single transaction sharing a `batchId` with `reason = RELOCATION`. Endpoint: `POST /api/clothing/relocation`. See ADR-0003.

### Inventarisierung (Inventory Reconciliation)

A Kleiderwart-only batch operation that reconciles the system's records for a location against physical reality. The Kleiderwart scans all items physically present at a location, the system compares against its records, and two sets of movements are produced:

- **Found items:** scanned items whose recorded `locationId` differs from the checked location → `fromLocationId = current locationId, toLocationId = checked locationId`
- **Missing items:** items recorded at the checked location but not scanned → `fromLocationId = checked locationId, toLocationId = null` ("Kein Standort")

Movement reason for both: `INVENTORY_RECONCILIATION`. All movements in one batch share a single `batchId` and are written atomically in a single transaction.

Endpoints (Kleiderwart-only, no discrepancy protocol — the Kleiderwart is the authority):
- `POST /api/clothing/inventory-reconciliation/{locationId}/preview` — computes diff (no side effects). Input: `{ scannedItemIds: number[] }`. Response: `{ unchangedItems: ResolvedClothingItem[], foundItems: ResolvedClothingItem[], missingItems: ResolvedClothingItem[] }`.
- `POST /api/clothing/inventory-reconciliation/{locationId}/execute` — applies changes. Input: the full preview response body. Response: `{ batchId: string, foundItemsCount: number, missingItemsCount: number, unchangedItemsCount: number }`.

The execute endpoint trusts the preview — no re-validation. The location picker allows any location type.

### Rückgabe (Return)

A ClothingMovement batch where items move from PERSONAL locations to a POOL or WAESCHE location without taking new items. Implemented as a Checkout with null `targetLocationId` and non-empty `returnItemIds`. Returns items may originate from different PERSONAL locations. Movement reason: `RETURN`. Two variants: wash-return (PERSONAL → WAESCHE) and pool-return (PERSONAL → POOL). See ADR-0004.

### Datenschutzerklärung (Privacy Policy Document)

A single, admin-managed document served publicly at `/privacy-policy`. At most one document is active at any time. Stored as a binary blob in a dedicated `privacy_policy` table alongside metadata (`file_name`, `content_type`, `file_size`, `uploaded_at`). No join is required — all data lives in one row. Managed by `PrivacyPolicyService` and persisted through the explicit JDBC `PrivacyPolicyRepository` (`find` / `save` / `delete`); uploading a new document atomically replaces the previous one.

Accepted formats: PDF (`application/pdf`), HTML (`text/html`), plain text (`text/plain`). Maximum file size: 10 MB. The `Content-Type` response header is derived from the stored `content_type` value; the server never re-detects the MIME type at serve time.

When no document has been uploaded, the endpoint returns `404`. Uploading a new document deletes the existing row and inserts a new one (no version history). The document can also be explicitly deleted by an admin, which returns the endpoint to the `404` state.

The upload/delete admin API lives under `/api/admin/privacy-policy` (ADMIN-only, GET metadata + POST multipart upload + DELETE). The public serving endpoint is `GET /privacy-policy` — a top-level route outside the `/api/**` namespace, accessible without authentication, streamed with the stored `Content-Type` and `Content-Disposition: inline`.

### UserAccount

A login. Roles: `USER`, `ADMIN`, `KLEIDERWART`. There is no separate "Firefighter" entity — every user is a potential firefighter. Note: tablets in the station may run a shared account, so the logged-in user is *not* a reliable identifier of who is physically performing an action.
