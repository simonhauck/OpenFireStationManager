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

A user-facing action that produces one or more `ClothingMovement` rows in a single batch and atomic transaction: optionally returning items from a PERSONAL location to a WAESCHE location, then taking items from a POOL location to that PERSONAL location. The Checkout itself is not a persisted aggregate — it is the API operation that writes the movements.

The endpoint is strict about types: source must be POOL, target must be PERSONAL, return target (if present) must be WAESCHE. Any authenticated user may perform a Checkout. Operations that violate these type rules (e.g. Kleiderwart rebalancing POOL ↔ POOL) require purpose-built, role-restricted endpoints — they are not Checkouts.

The endpoint is two-phase (see ADR-0002): phase 1 reports `Discrepancy` records when the user's claim disagrees with the system's recorded `locationId`; phase 2 accepts an `acknowledgedWarnings` list and writes the movements.

### Discrepancy

A disagreement between a user's claim during phase 1 of a Checkout and the system's recorded `locationId` for an item — e.g. the user claims to be taking item #123 from Pool A, but the system has it at Locker 3. Discrepancies are reported back to the user, who may acknowledge them; an acknowledged Discrepancy results in a single `CHECKOUT` (or `RETURN`) movement with `fromLocationId` equal to the claimed source. No compensating movement is inserted to explain the prior drift.

### Item lookup endpoints

Two purpose-built endpoints serve the Checkout flow's item picker:

- `GET /api/clothing/items/by-barcode/{barcode}` — strict-equality lookup for the HID barcode scanner. Returns a `ResolvedClothingItem` DTO carrying the item plus its current location's name and type. 404 when the barcode is unknown **or** when the requesting user is not Kleiderwart and the item is at an `onlyVisibleForKleiderwart` location (the two cases are intentionally indistinguishable to clients; logs record the real reason).
- `GET /api/clothing/items/search?q=<text>&limit=<n>` — fuzzy typeahead for the Combobox backup. Matches type name, size, and barcode (case-insensitive contains, any field). Hard-capped result count, no pagination. Items at `onlyVisibleForKleiderwart` locations are filtered out for non-Kleiderwart callers.

### Umlagerung (Relocation)

A Kleiderwart-only batch operation that moves one or more clothing items to any target location regardless of location type. Unlike Checkout, there is no discrepancy protocol — the source location is inferred per item from its current `locationId` in the database. All movements are written atomically in a single transaction sharing a `batchId` with `reason = RELOCATION`. Endpoint: `POST /api/clothing/relocation`. See ADR-0003.

### UserAccount

A login. Roles: `USER`, `ADMIN`, `KLEIDERWART`. There is no separate "Firefighter" entity — every user is a potential firefighter. Note: tablets in the station may run a shared account, so the logged-in user is *not* a reliable identifier of who is physically performing an action.

### Datenschutzerklärung (Privacy Policy)

The legally required privacy policy document. At most one document exists at any time, stored as a single row in the `privacy_policy` table together with its binary `content`, `fileName`, `contentType`, `fileSize`, and `uploadedAt`. Managed by `PrivacyPolicyService` and persisted through the explicit JDBC `PrivacyPolicyRepository` (`find` / `save` / `delete`); uploading a new document atomically replaces the previous one.

Admins manage it through ADMIN-only endpoints under `/api/admin/privacy-policy` (GET metadata, POST multipart upload, DELETE). Accepted MIME types are `application/pdf`, `text/html`, and `text/plain`; the maximum size is 10 MB. The document is served publicly — without authentication — at the top-level, bookmarkable URL `GET /privacy-policy` (deliberately outside the `/api/**` namespace), streamed with the stored `Content-Type` and `Content-Disposition: inline`. The stored `content_type` is the authoritative header value; the server never re-detects the MIME type at serve time. When no document is present, `/privacy-policy` returns 404.
