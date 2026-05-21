# Client Glossary

Domain language for the React / TypeScript frontend.

## Terms

### Pool Klamotten

The dashboard view at `/pool-clothing` summarising clothing on `POOL` and `WAESCHE` locations. Read-only overview; the transactional checkout flow is separate.

### Standort

User-facing label for `ClothingLocation`.

### Klamotten / Kleidung

Informal vs. formal labels for clothing items. Both appear in the UI; "Klamotten" tends to be used in headings/navigation, "Kleidung" in form labels.

### Location type

UI surfaces the four backend types (POOL, WAESCHE, PERSONAL, OTHER) when creating/editing a `Standort`. Only POOL is selectable as a checkout source; only PERSONAL is selectable as a checkout target; only WAESCHE is selectable as a return target.

### Tablet routes

`/pool-clothing` and `/pool-clothing/checkout` are the tablet-facing routes. Both apply Material-standard minimum tap-target sizes (48 dp / 48 px) via thin feature-local wrappers around shadcn primitives. The rest of the app uses default shadcn sizing because it is operated on desktop by Kleiderwart and Admin users.

### Checkout flow

The `/pool-clothing/checkout` route is a single route that runs an internal step machine; it is not a set of sub-routes. Wizard steps in order: pick target PERSONAL → pick items to take → review locker contents and toggle returns (auto-pre-toggled by type match) → if any returns, pick WAESCHE → review screen → submit. There is no source-pool pre-selection; the source is inferred per item from the item's current `locationId`.

The route is reached from a "Klamotten Ausgabe" button on `/pool-clothing` (top-right of the page); it is also reachable by direct URL. The route itself is `RoleGuard`-ed for the `USER` role.

Picker UI scales by cardinality:

- **Few items (a handful of WAESCHE locations):** tile grid, single tap, no search.
- **Many items (>100 PERSONAL locations, >1000 clothing items):** searchable Combobox with typeahead, primary input on tablet. For items the barcode scanner is the primary input and the Combobox is the backup.

Touch optimisation is mandatory throughout; this flow is the primary tablet UX.

### Page Section

The full-page layout wrapper used on each route. Renders a `bg-muted` surface (rounded, full-height) that visually separates the page from the plain app background. Contains a header row (title, optional subtitle, optional action buttons) and a body area for page content. Inner `Card` components sit on top of the muted surface and are visually distinct from it. Accepts `buttonPosition: "right" | "center"` to control action-button alignment. Used on both tablet and desktop routes; callers are responsible for passing appropriately sized button components (`TouchButton` on tablet routes, shadcn `Button` on desktop routes).
