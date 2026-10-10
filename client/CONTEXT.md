
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

`/pool-clothing` and `/pool-clothing/checkout` are the tablet-facing routes. Both enforce Material-standard minimum tap-target sizes (48 dp / 48 px) through a coarse-pointer theme adaptation that raises control sizes on touch devices. The rest of the app uses the default element sizes because it is operated on desktop by Kleiderwart and Admin users.

### Ausgabe (Issue)

The left column of the combined swap screen: items that will be moved to the chosen PERSONAL Standort. The same word labels the take section of the review step. Counterpart: Rückgabe.

### Checkout flow

The `/pool-clothing/checkout` route is a single route that runs an internal step machine; it is not a set of sub-routes. Wizard steps in order: pick target PERSONAL → combined Ausgabe/Rückgabe screen → if any returns, pick WAESCHE → review screen → submit (5 steps). There is no source-pool pre-selection; the source is inferred per item from the item's current `locationId`.

The combined screen (ADR-0005) sorts every scanned or selected item automatically: items recorded at the chosen Standort are return candidates and are selected in the right Rückgabe column; everything else goes to the left Ausgabe column. The right column lists the Standort's full contents with a per-item checkbox; items of a taken type are pre-selected (type match, size ignored). Each Ausgabe row has a "Zurückgeben" action to force a return; forced returns appear on the right with an origin badge. The recorded location of non-POOL items is shown inline as a `Standort: …` badge — there is no confirmation dialog. Unticking a locker row keeps the item; unticking a forced return puts the item back into Ausgabe. Continue is enabled while either column has content, so a return-only batch can run through the swap flow.

The route is reached from a "Klamotten tauschen" button on `/pool-clothing` (top-right of the page); it is also reachable by direct URL. The route itself is `RoleGuard`-ed for the `USER` role.

During a user-feedback trial on the feature branch, the previous wizard remains reachable at `/pool-clothing/checkout-classic` ("Klamotten tauschen (klassisch)"). It runs the original 6-step flow unchanged (separate scan step, return toggles, discrepancy dialog), same `USER` guard. Both routes submit the same `POST /api/clothing/checkouts` and share no state; the classic variant is removed once the trial concludes.

Picker UI scales by cardinality:

- **Few items (a handful of WAESCHE locations):** tile grid, single tap, no search.
- **Many items (>100 PERSONAL locations, >1000 clothing items):** searchable Combobox with typeahead, primary input on tablet. For items the barcode scanner is the primary input and the Combobox is the backup.

### Barcode-Bilder

The always-visible gallery on every scanner screen, showing all `BarcodeImage`s grouped by clothing type under the heading "Wo finde ich den Barcode?". Tapping an image opens it full-screen. Managed by the Kleiderwart on the clothing type create and edit pages; hidden when no type has images. A deliberate trial of showing everything at once — the fallback shape is a horizontally scrollable one-tile-per-type strip.

### Inventarisierung (Inventory Reconciliation)

The `/pool-clothing/inventory-reconciliation` route is a KLEIDERWART-only wizard for reconciling the system's records for a location against physical reality. Reached from an "Inventarisierung starten" button on `/pool-clothing`. The route is `RoleGuard`-ed for the `KLEIDERWART` role.

4-step wizard: 1) Standort wählen → 2) Kleidung scannen (running count) → 3) Differenzen & Bestätigen (preview diff, warn about missing items → Kein Standort, confirm) → 4) Fertig (summary with auto-redirect).

### Umlagerung (Relocation)

The `/pool-clothing/relocation` route is a KLEIDERWART-only batch operation for moving items between locations of any type. Reached from an "Umlagerung starten" button on `/pool-clothing`. The route is `RoleGuard`-ed for the `KLEIDERWART` role.

### Rückgabe (Return)

The word also labels the right column of the combined swap screen (see Checkout flow); this section covers the return-only route.

The `/pool-clothing/return` route handles clothing returns without taking new items. Two variants reached from separate buttons on `/pool-clothing`:

- **"Klamotten in die Wäsche geben"** → `?returnTarget=WAESCHE` — return items to a laundry basket.
- **"Klamotten zurück in den Pool geben"** → `?returnTarget=POOL` — return clean items to the pool.

The route uses an internal step machine (separate from Checkout): select return items → pick return target (tile grid, filtered by mode) → review → submit. The item selection screen supports three input modes on a tab toggle: barcode scanner (with internal scan/manual-search toggle), location-based picker (dialog: pick Spind → checkboxes → add). Scanner has no discrepancy guard. Returns may originate from different PERSONAL locations. Submits to `POST /api/clothing/checkouts` with null `targetLocationId`. `RoleGuard`-ed for `USER`.

### Page Section

The full-page layout wrapper used on each route. Renders a `bg-muted` surface (rounded, full-height) that visually separates the page from the plain app background. Contains a header row (title, optional subtitle, optional action buttons) and a body area for page content. Inner `Card` components sit on top of the muted surface and are visually distinct from it. Accepts `buttonPosition: "right" | "center"` to control action-button alignment. Used on both tablet and desktop routes; callers are responsible for passing appropriately sized button components.

### Page Sub Section

A named content group used inside a `Page Section` body. Renders a header row (`<h2>` title, optional subtitle, optional right slot for summary info or actions) separated from its content by a `border-b`. Multiple `Page Sub Section`s stacked inside a `Page Section` are divided by a `border-t` on all but the first. The right slot accepts any `ReactNode` — typically a stat display (e.g. total count) or a secondary action. Does not use a card surface; sits directly on the `Page Section`'s `bg-muted` body.

### Admin Settings

The `/admin/settings` route (ADMIN-only via `RoleGuard`, reached from the "Admin Einstellungen" nav item) hosts application-wide configuration. It renders a `Page Section` containing the `Datenschutzerklärung` sub-section: it shows the currently active privacy policy document's name and upload date (or a "no document uploaded yet" empty state), a file picker plus upload button, a delete action, and a "Vorschau" link to the public `/privacy-policy` URL. Data and mutations use TanStack Query (`privacyPolicyQuery`, `uploadPrivacyPolicyMutation`, `deletePrivacyPolicyMutation`); a 404 from the metadata endpoint is treated as the empty state rather than an error.

### Datenschutzerklärung (Privacy Policy Document)

The admin-uploadable privacy policy document, managed under `/admin/settings`. Accepted formats: PDF, HTML, plain text. At most one document is active at a time. Uploading replaces the current document; explicit deletion is also available. When no document is uploaded the admin UI shows a clear "no document uploaded yet" state. The document itself is served directly by the backend at `/privacy-policy` (not via the frontend); the admin UI links to that URL for preview purposes.

### Mitglied

User-facing label for `Member` — a person in the organisation. Deliberately distinct from **Nutzer Management** (`/user-management`), which manages `UserAccount` logins: Mitglieder are people, Nutzer are credentials, and the two are not linked. Because both now appear in the top nav, the labels carry the whole distinction; retitling "Nutzer Management" to something like "Logins" would sharpen it.

Top-level route `/members`, `KLEIDERWART`-guarded, with entries in `MENU_ITEMS` (nav config), `DASHBOARD_ITEMS` (`dashboard.tsx`), and `SEGMENT_LABELS` (`Breadcrumb.tsx`) — all three lists are duplicated and must be kept in step. Four routes: list, `/new`, `/$memberId` (detail), `/$memberId/edit`.

The **detail page** is the "what gear does this person have?" screen and is the reason a detail view exists at all. Three sections: Kopf (name, audit metadata, Bearbeiten/Löschen actions); Standorte (the member's locations, each linking to the location edit page — assignment is only ever written from the location side); Kleidung (every item currently in those locations, from `GET /api/clothing/locations/{id}/items`, one call per locker).

Deleting a member unassigns their locations rather than blocking. The delete dialog states how many locations and clothing items are affected and warns that the clothing needs relocating.

No batch import — the one-off bulk load happens in the backend migration from locker comments; afterwards members arrive one at a time.
