
# Client Glossary

Domain language for the React / TypeScript frontend.

## Terms

### Pool Klamotten

The dashboard view at `/pool-clothing` summarising clothing on `POOL` and `WAESCHE` locations. Read-only overview; the transactional checkout flow is separate.

### Standort

User-facing label for `ClothingLocation`.

Location pickers (combobox dropdowns) display a formatted label built from the location's fields:

- Name only: `Spind 5`
- Name + member: `Spind 5 – Hans Müller`
- Name + comment: `Spind 5 – defekt`
- Name + member + comment: `Spind 5 – Hans Müller – defekt`
- Name + member + type: `Spind 5 – Hans Müller (Persönlicher Standort)`

A `PERSONAL` location's owner is the linked `Mitglied`; the `comment` field is generic free text alongside it ("defekt", "hinten links"). Both are shown when both are present. Before the member migration, `comment` was where the owner's name was written by hand — hence the fallback. Whether the type is shown depends on the picker context — checkout hides the type (all options are PERSONAL), relocation shows it (any type may appear).

### Klamotten / Kleidung

Informal vs. formal labels for clothing items. Both appear in the UI; "Klamotten" tends to be used in headings/navigation, "Kleidung" in form labels.

### Location type

UI surfaces the four backend types (POOL, WAESCHE, PERSONAL, OTHER) when creating/editing a `Standort`. Only POOL is selectable as a checkout source; only PERSONAL is selectable as a checkout target; WAESCHE and POOL are selectable as return targets.

### Tablet routes

`/pool-clothing` and `/pool-clothing/checkout` are the tablet-facing routes. Both apply Material-standard minimum tap-target sizes (48 dp / 48 px) via thin feature-local wrappers around shadcn primitives. The rest of the app uses default shadcn sizing because it is operated on desktop by Kleiderwart and Admin users.

### Checkout flow

The `/pool-clothing/checkout` route is a single route that runs an internal step machine; it is not a set of sub-routes. Wizard steps in order: pick target PERSONAL → pick items to take → review locker contents and toggle returns (auto-pre-toggled by type match) → if any returns, pick WAESCHE → review screen → submit. There is no source-pool pre-selection; the source is inferred per item from the item's current `locationId`.

The route is reached from a "Klamotten tauschen" button on `/pool-clothing` (top-right of the page); it is also reachable by direct URL. The route itself is `RoleGuard`-ed for the `USER` role.

When the user scans or selects an item that is not at a POOL location, a client-side confirmation dialog is shown before the item is added to the list. This is a purely frontend UX guard — the backend does not validate the source location type and performs no two-phase protocol.

Picker UI scales by cardinality:

- **Few items (a handful of WAESCHE locations):** tile grid, single tap, no search.
- **Many items (>100 PERSONAL locations, >1000 clothing items):** searchable Combobox with typeahead, primary input on tablet. For items the barcode scanner is the primary input and the Combobox is the backup.

### Inventarisierung (Inventory Reconciliation)

The `/pool-clothing/inventory-reconciliation` route is a KLEIDERWART-only wizard for reconciling the system's records for a location against physical reality. Reached from an "Inventarisierung starten" button on `/pool-clothing`. The route is `RoleGuard`-ed for the `KLEIDERWART` role.

4-step wizard: 1) Standort wählen → 2) Kleidung scannen (running count) → 3) Differenzen & Bestätigen (preview diff, warn about missing items → Kein Standort, confirm) → 4) Fertig (summary with auto-redirect).

### Umlagerung (Relocation)

The `/pool-clothing/relocation` route is a KLEIDERWART-only batch operation for moving items between locations of any type. Reached from an "Umlagerung starten" button on `/pool-clothing`. The route is `RoleGuard`-ed for the `KLEIDERWART` role.

### Rückgabe (Return)

The `/pool-clothing/return` route handles clothing returns without taking new items. Two variants reached from separate buttons on `/pool-clothing`:

- **"Klamotten in die Wäsche geben"** → `?returnTarget=WAESCHE` — return items to a laundry basket.
- **"Klamotten zurück in den Pool geben"** → `?returnTarget=POOL` — return clean items to the pool.

The route uses an internal step machine (separate from Checkout): select return items → pick return target (tile grid, filtered by mode) → review → submit. The item selection screen supports three input modes on a tab toggle: barcode scanner (with internal scan/manual-search toggle), location-based picker (dialog: pick Spind → checkboxes → add). Scanner has no discrepancy guard. Returns may originate from different PERSONAL locations. Submits to `POST /api/clothing/checkouts` with null `targetLocationId`. `RoleGuard`-ed for `USER`.

### Page Section

The full-page layout wrapper used on each route. Renders a `bg-muted` surface (rounded, full-height) that visually separates the page from the plain app background. Contains a header row (title, optional subtitle, optional action buttons) and a body area for page content. Inner `Card` components sit on top of the muted surface and are visually distinct from it. Accepts `buttonPosition: "right" | "center"` to control action-button alignment. Used on both tablet and desktop routes; callers are responsible for passing appropriately sized button components (`TouchButton` on tablet routes, shadcn `Button` on desktop routes).

### Page Sub Section

A named content group used inside a `Page Section` body. Renders a header row (`<h2>` title, optional subtitle, optional right slot for summary info or actions) separated from its content by a `border-b`. Multiple `Page Sub Section`s stacked inside a `Page Section` are divided by a `border-t` on all but the first. The right slot accepts any `ReactNode` — typically a stat display (e.g. total count) or a secondary action. Does not use a card surface; sits directly on the `Page Section`'s `bg-muted` body.

### Admin Settings

The `/admin/settings` route (ADMIN-only via `RoleGuard`, reached from the "Admin Einstellungen" nav item) hosts application-wide configuration. It renders a `Page Section` containing the `Datenschutzerklärung` sub-section: it shows the currently active privacy policy document's name and upload date (or a "no document uploaded yet" empty state), a file picker plus upload button, a delete action, and a "Vorschau" link to the public `/privacy-policy` URL. Data and mutations use TanStack Query (`privacyPolicyQuery`, `uploadPrivacyPolicyMutation`, `deletePrivacyPolicyMutation`); a 404 from the metadata endpoint is treated as the empty state rather than an error.

### Datenschutzerklärung (Privacy Policy Document)

The admin-uploadable privacy policy document, managed under `/admin/settings`. Accepted formats: PDF, HTML, plain text. At most one document is active at a time. Uploading replaces the current document; explicit deletion is also available. When no document is uploaded the admin UI shows a clear "no document uploaded yet" state. The document itself is served directly by the backend at `/privacy-policy` (not via the frontend); the admin UI links to that URL for preview purposes.

### Mitglied

User-facing label for `Member` — a person in the organisation. Deliberately distinct from **Nutzer Management** (`/user-management`), which manages `UserAccount` logins: Mitglieder are people, Nutzer are credentials, and the two are not linked. Because both now appear in the top nav, the labels carry the whole distinction; retitling "Nutzer Management" to something like "Logins" would sharpen it.

Top-level route `/members`, `KLEIDERWART`-guarded, with entries in `MENU_ITEMS` (`Header.tsx`), `DASHBOARD_ITEMS` (`dashboard.tsx`), and `SEGMENT_LABELS` (`Breadcrumb.tsx`) — all three lists are duplicated and must be kept in step. Four routes: list, `/new`, `/$memberId` (detail), `/$memberId/edit`.

The **detail page** is the "what gear does this person have?" screen and is the reason a detail view exists at all. Three sections: Kopf (name, audit metadata, Bearbeiten/Löschen actions); Standorte (the member's locations, each linking to the location edit page — assignment is only ever written from the location side); Kleidung (every item currently in those locations, from `GET /api/clothing/locations/{id}/items`, one call per locker).

Deleting a member unassigns their locations rather than blocking. The delete dialog states how many locations and clothing items are affected and warns that the clothing needs relocating.

No batch import — the one-off bulk load happens in the backend migration from locker comments; afterwards members arrive one at a time.
