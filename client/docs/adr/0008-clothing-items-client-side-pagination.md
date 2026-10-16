
# ADR-0008: Client-side pagination for the Kleidungsstücke table

**Status:** Accepted
**Date:** 2026-10-16

## Context

`ClothingItemsTable` rendered every clothing item in one commit. The list endpoint (`GET /api/clothing/items`) deliberately returns every item in resolved form — see [server ADR-0006](../../server/docs/adr/0006-resolved-clothing-item-view.md) — and the table's search, sorting and column filtering all run client-side over that full array. Each row also mounts two icon buttons and an `AlertDialog`.

With a production-sized station database (381 items), the table's first commit took ~1 s on an idle dev machine and 2.3–4.9 s while a fully parallel Playwright run was loading the machine. The Mitglied column compounds the cost: names resolve through the members list query, whose fetch only starts after the table's first commit, and resolving the names then re-renders the whole table ([client ADR-0006](0006-member-name-resolution-and-rendering.md)). Under that load the e2e workflow "shows the holder of an item and links to the member detail page" exceeded Playwright's 5 s expect timeout.

The 2026-10-11 addendum to server ADR-0006 recorded pagination and the rendering cost of the full list as explicitly out of scope. This ADR supersedes that consequence.

## Decision

- `ClothingItemsTable` paginates client-side using Astryx's `useTablePagination` plugin and the `paginateData` helper — the same plugin pattern the table already uses for sorting and column settings.
- The full item list is still fetched, searched, filtered and sorted as before; only the current page slice is handed to `Table`.
- Default page size is 25, with a selector offering 10 / 25 / 50 / 100. Changing the page size returns to page 1.
- Changing the search term returns to page 1, and the current page is clamped to the last valid page when the filtered list shrinks (for example after a deletion), so the table can never show an empty page while matches exist.
- `rowIndexStart` and `rowCount` are passed to `Table`, so `aria-rowindex` / `aria-rowcount` describe the full result set rather than the visible page.
- The default sort becomes ID **descending**: a newly registered item is visible on page 1 instead of the last page, keeping the create → verify-in-list workflow intact now that the table is paginated.

## Consequences

- The first commit mounts at most `pageSize` rows instead of every item; the members query fires promptly and the holder e2e workflow passes without raising any timeout.
- Every other table in the client that renders a full collection has the same unbounded pattern — Standorte (152 rows in the same database) and Mitglieder (124 rows) are the largest today — and remain follow-up candidates. This ADR establishes the pattern to copy.
- All items still travel over the wire and remain in memory; the payload is unchanged from before. If payload size becomes a problem, server-side pagination of `listClothingItems` (a `page`/`size` or cursor parameter) is the lever, and the endpoint stays compatible with that change.
- Users no longer scan a single long list to find a specific item; the existing search field is the intended shortcut, and the recent-first default surfaces newly registered items.

## Alternatives rejected

- **Virtualising the table.** Astryx `Table` has no built-in row virtualisation — the plugin pipeline could host one, but it would be custom code. Pagination is the supported, simpler option and matches the "browse inventory" workflow.
- **Server-side pagination now.** Correct long-term shape for the payload as well, but it requires an API change plus generated-binding and MCP churn; current payloads (~275 KB for 381 items) do not justify it yet.
- **Infinite scrolling.** No first-class Astryx support outside chat; the sentinel/observer wiring is bespoke, and e2e assertions against "load more on scroll" are more fragile than asserting a page.
- **Raising the Playwright timeout instead.** Treats the symptom: the first render would stay multi-second, and the page would still mount every row.
- **Keeping the ID-ascending default.** With pagination, newly created items land on the last page, breaking the create → verify-in-list flow for users and e2e alike.
