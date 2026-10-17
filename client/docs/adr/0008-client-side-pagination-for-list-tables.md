
# ADR-0008: Client-side pagination for the list tables

**Status:** Accepted
**Date:** 2026-10-16

## Context

The Kleidungsstücke, Standorte and Mitglieder tables each rendered their whole collection in one commit. The list endpoints deliberately return every row in resolved form — see [server ADR-0006](../../server/docs/adr/0006-resolved-clothing-item-view.md) — and each table's search, sorting and column filtering run client-side over that full array. The Kleidungsstücke rows are the heaviest: each mounts two icon buttons and an `AlertDialog`, and the Mitglied column resolves names through the members list query, whose fetch only starts after the table's first commit, after which resolving the names re-renders the whole table ([client ADR-0006](0006-member-name-resolution-and-rendering.md)).

With a production-sized station database (381 items, 152 locations, 124 members), the Kleidungsstücke table's first commit took ~1 s on an idle dev machine and 2.3–4.9 s while a fully parallel Playwright run was loading the machine. Under that load the e2e workflow "shows the holder of an item and links to the member detail page" exceeded Playwright's 5 s expect timeout. The 2026-10-11 addendum to server ADR-0006 recorded pagination and the rendering cost of the full list as explicitly out of scope. This ADR supersedes that consequence.

## Decision

- The Kleidungsstücke, Standorte and Mitglieder tables paginate client-side through a shared `useClientPagination` hook, which wraps Astryx's `useTablePagination` plugin and `paginateData` helper — the same plugin pattern the tables already use for sorting and column settings.
- Each table still fetches, searches, filters and sorts its full collection as before; only the current page slice is handed to `Table`.
- Default page size is 25, with a selector offering 10 / 25 / 50 / 100. Changing the page size returns to page 1.
- Changing the search term returns to page 1, and the current page is clamped to the last valid page when the filtered list shrinks (for example after a deletion), so a table can never show an empty page while matches exist.
- The hook supplies `rowIndexStart` and `rowCount`, so `aria-rowindex` / `aria-rowcount` describe the full result set rather than the visible page.
- All three tables default to newest-first (ID descending; `Erstellt am` descending for members, which has no ID column): a newly registered entry is visible on page 1 instead of the last page, keeping the create → verify-in-list workflow intact. Any other sort remains one column click away.

## Consequences

- The first commit of each table mounts at most `pageSize` rows instead of every row; the members query fires promptly and the holder e2e workflow passes without raising any timeout.
- UsersTable (23 rows) and the `LockerItemDialog` list (every item at one location) still render unbounded and remain candidates if they grow.
- All rows still travel over the wire and remain in memory; the payloads are unchanged from before. If payload size becomes a problem, server-side pagination of `listClothingItems` (a `page`/`size` or cursor parameter) is the lever, and the endpoint stays compatible with that change.
- Users no longer scan a single long list to find a specific row; the existing search field is the intended shortcut, and the newest-first default surfaces newly created entries.

## Alternatives rejected

- **Virtualising the tables.** Astryx `Table` has no built-in row virtualisation — the plugin pipeline could host one, but it would be custom code. Pagination is the supported, simpler option and matches the "browse inventory" workflow.
- **Server-side pagination now.** Correct long-term shape for the payload as well, but it requires an API change plus generated-binding and MCP churn; current payloads (~275 KB for 381 items) do not justify it yet.
- **Infinite scrolling.** No first-class Astryx support outside chat; the sentinel/observer wiring is bespoke, and e2e assertions against "load more on scroll" are more fragile than asserting a page.
- **Raising the Playwright timeout instead.** Treats the symptom: the first renders would stay multi-second, and the pages would still mount every row.
- **Keeping the previous defaults (ID ascending for items and locations, name ascending for members).** With pagination, newly created entries land on an unpredictable page, breaking the create → verify-in-list flow for users and e2e alike.
