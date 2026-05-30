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

### ClothingMovement

An append-only record of an item moving from one location to another (or being assigned a location for the first time). One row per item per move. Reasons: `CHECKOUT` (POOL → PERSONAL), `RETURN` (PERSONAL → WAESCHE), `MANUAL_CORRECTION` (Kleiderwart edits), `INITIAL_PLACEMENT` (item created with a location), `RELOCATION` (Kleiderwart bulk move to any location type). Movements created by the same batch operation share a `batchId`. See ADR-0001.

### Checkout

A user-facing action that produces one or more `ClothingMovement` rows in a single batch and atomic transaction: optionally returning items from a PERSONAL location to a WAESCHE location, then taking items from any location to that PERSONAL location. The Checkout itself is not a persisted aggregate — it is the API operation that writes the movements.

The endpoint validates that the target must be PERSONAL and the return target (if present) must be WAESCHE. The source location type of taken items is **not** validated server-side — the source is inferred per item from its current `locationId` in the database. Any authenticated user may perform a Checkout. The endpoint is a single `POST /api/clothing/checkouts` with no two-phase protocol; discrepancy handling (warning the user when a scanned item is not at a POOL location) is a client-side UX concern only.

### Item lookup endpoints

Two purpose-built endpoints serve the Checkout flow's item picker:

- `GET /api/clothing/items/by-barcode/{barcode}` — strict-equality lookup for the HID barcode scanner. Returns a `ResolvedClothingItem` DTO carrying the item plus its current location's name and type. 404 when the barcode is unknown **or** when the requesting user is not Kleiderwart and the item is at an `onlyVisibleForKleiderwart` location (the two cases are intentionally indistinguishable to clients; logs record the real reason).
- `GET /api/clothing/items/search?q=<text>&limit=<n>` — fuzzy typeahead for the Combobox backup. Matches type name, size, and barcode (case-insensitive contains, any field). Hard-capped result count, no pagination. Items at `onlyVisibleForKleiderwart` locations are filtered out for non-Kleiderwart callers.

### Umlagerung (Relocation)

A Kleiderwart-only batch operation that moves one or more clothing items to any target location regardless of location type. Unlike Checkout, there is no discrepancy protocol — the source location is inferred per item from its current `locationId` in the database. All movements are written atomically in a single transaction sharing a `batchId` with `reason = RELOCATION`. Endpoint: `POST /api/clothing/relocation`. See ADR-0003.

### Datenschutzerklärung (Privacy Policy Document)

A single, admin-managed document served publicly at `/privacy-policy`. At most one document is active at any time. Stored as a binary blob in a dedicated `privacy_policy` table alongside metadata (`file_name`, `content_type`, `file_size`, `uploaded_at`). No join is required — all data lives in one row. Managed by `PrivacyPolicyService` and persisted through the explicit JDBC `PrivacyPolicyRepository` (`find` / `save` / `delete`); uploading a new document atomically replaces the previous one.

Accepted formats: PDF (`application/pdf`), HTML (`text/html`), plain text (`text/plain`). Maximum file size: 10 MB. The `Content-Type` response header is derived from the stored `content_type` value; the server never re-detects the MIME type at serve time.

When no document has been uploaded, the endpoint returns `404`. Uploading a new document deletes the existing row and inserts a new one (no version history). The document can also be explicitly deleted by an admin, which returns the endpoint to the `404` state.

The upload/delete admin API lives under `/api/admin/privacy-policy` (ADMIN-only, GET metadata + POST multipart upload + DELETE). The public serving endpoint is `GET /privacy-policy` — a top-level route outside the `/api/**` namespace, accessible without authentication, streamed with the stored `Content-Type` and `Content-Disposition: inline`.

### UserAccount

A login. Roles: `USER`, `ADMIN`, `KLEIDERWART`. There is no separate "Firefighter" entity — every user is a potential firefighter. Note: tablets in the station may run a shared account, so the logged-in user is *not* a reliable identifier of who is physically performing an action.
