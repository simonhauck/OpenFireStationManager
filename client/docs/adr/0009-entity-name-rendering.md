
# ADR-0009: Entity references render as text links, not chips

**Status:** Accepted
**Date:** 2026-10-18
**Supersedes:** [ADR-0006](0006-member-name-resolution-and-rendering.md)

## Context

Members and Standorte are both first-class entities with their own pages, and both are referenced from tables, detail sections, pickers and wizards. Their rendering had drifted:

- A member's Standorte were neutral Astryx `Badge` chips wrapped in a `Link`, so they looked like the read-only type badges elsewhere but behaved like navigation.
- Standort names were plain text on the items list, text links in the member detail, headings in the member clothing section, and `Badge`/`Token` chips for checkout origins and inventory reconciliation.
- `MemberName` already linked, but with only `hover:underline` and inherited text colour. The link affordance was invisible until hover and absent entirely on touch devices.

Issue #338 proposed extracting the clickable chip into a reusable component and adopting it on the items list. That would make the affordance problem systemic: Astryx's Badge guidance is explicit that badges are read-only indicators and should not be clickable, and repeated badges in every table row add noise rather than information.

The inconsistency is not "chips here, text there". It is mixing a navigation affordance (Link) with an indicator component (Badge/Token), while rendering other references as links that do not look interactive.

## Decision

Render first-class entity references according to their role in the current context, not according to the entity type:

- **Standalone reference in a table cell, detail row or list** — plain text link to the entity's page, using the design system's link styling (accent colour, hover underline, focus ring). For Standorte this is the read-only detail page.
- **Page title or section heading** — plain heading, not a link. Navigation, if needed, is an explicit action.
- **Composed label in a picker or wizard review** — plain text via `formatClothingLocationLabel`; no nested links or chips.
- **Status, category, origin, count or exception** — non-interactive chip (`Badge`/`Token`), only when the value needs emphasis. Chips are never wrapped in links.
- **Current page's own subject** — plain text.

Concretely:

- `EntityNameLink` (`src/components/base/EntityNameLink.tsx`) is the shared link rendering for entity names.
- `MemberName` keeps its resolution rules from ADR-0006 (`useMemberNameLookup`, pre-resolved names for sorting/search, no per-row fetch, muted dash fallback) and now renders through `EntityNameLink`.
- `LocationName` (`src/clothing/components/shared/LocationName.tsx`) is the equivalent rendering primitive for Standorte: link when an id is available, plain text without one, muted dash without a name.
- Clickable `Badge` compositions are removed. The members list shows Standort links, not chips; the items and locations lists use `LocationName`.
- Chips remain for metadata: Standort type, availability counts, and the checkout origin token. Inventory reconciliation shows the origin token only when an item's recorded location differs from the location being reconciled.
- `formatClothingLocationLabel` remains the only formatter for string consumers (search haystacks, sort comparators, picker options, review copy).

Implementation surfaces using `LocationName`: members list, member detail Standorte, clothing items list, clothing locations list. Member clothing group headings and Pool overview section headings stay plain headings, with an explicit **Details** action next to each heading linking to the Standort detail page.

## Consequences

- Members and Standorte now follow the same mental model: entity name = text, link when it navigates; chip = metadata.
- Links are recognisable without hovering, including on the tablet routes.
- Clickable badges disappear, so neutral badges (type, roles) regain a single, read-only meaning.
- `LocationName` targets the read-only Standort detail page; editing is an explicit action from that page or the locations list. A future destination change remains a one-line update inside `LocationName`.
- Table rows stay visually calmer than with a chip per reference, and status chips stand out again.
- The E2E page objects and tests refer to Standort links rather than chips; issue #338's scope is revised from "clickable chip component" to `LocationName`.
- ADR-0006 is superseded, but its name-resolution decisions remain in force through `MemberName` and `useMemberNameLookup`.

## Alternatives rejected

- **Extract and adopt a clickable Standort chip (original issue #338 scope).** Makes the inconsistent affordance reusable, conflicts with Astryx Badge guidance, and repeats a tag in every row.
- **Render every Standort and member as plain text.** Removes useful navigation and makes entity references indistinguishable from immutable values.
- **Make member names chips as well.** A chip in every table row is visual noise; member names are identities, not categories, and clickable chips remain hard to discover.
- **Keep per-call-site link markup.** Already drifted: one surface had a chip, one a heading, one a hover-only link. One primitive per entity is what keeps the treatment aligned.
