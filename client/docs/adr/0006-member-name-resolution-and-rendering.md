
# ADR-0006: Shared member name resolution and rendering

**Status:** Superseded by [ADR-0009](0009-entity-name-rendering.md)
**Date:** 2026-10-10

## Context

Members are referenced from many client surfaces: table cells, location labels, dialogs and pickers. Two different shapes of consumption exist and were being solved ad hoc at each call site:

1. **Strings** — search haystacks, sort comparators and picker labels (`formatClothingLocationLabel`) need a plain name, because they run outside React rendering.
2. **JSX** — table cells want the name as a link to `/members/$memberId`, with a muted dash when there is no owner.

PR #342 (issue #337, the Mitglied column on the Kleidungsstücke list) made the duplication concrete: the same item → Standort → `memberId` → name derivation appeared three times in one component (search, comparator, cell), each with its own fallback rules, and the link/dash markup was copy-pasted from `MembersTable`. Nothing forced the renderings to stay consistent.

## Decision

Separate resolution from rendering, and give each a single home:

- **`useMemberNameLookup()` stays the only resolution primitive.** It resolves `memberId → name` from the shared members list query. Every non-JSX consumer (search, sorting, option labels) keeps using it.
- **`MemberName` (`src/members/components/shared/MemberName.tsx`) is the only rendering primitive** for member name references. It accepts a pre-resolved `name` and/or a `memberId`; when only the id is given it resolves via the lookup hook. It renders a link to `/members/$memberId` when an id is available, otherwise a `fallback` (default: muted dash).
- **No per-call-site fetch strategy.** Name rendering always resolves against the members list. The by-id query (`getMemberByIdQuery`) stays reserved for the member detail page; a `useSingle`-style switch on the component would create two cache entries for the same member and inconsistent loading behavior per call site.
- **Sorting is resolved before the table sorts.** Tables enrich their rows once via `useMemo` (`memberName` field per row, `MemberName` receives it as `name`); comparators remain pure functions of row data. No fetching happens inside comparators or per-row components.
- **Cache coherence is TanStack Query's job.** Member mutations already invalidate `queryKeys.members()`, so every `MemberName` consumer updates automatically. The component adds no refetch or invalidation logic.

## Consequences

- All member references render identically: same link target, same underline hover, same missing-owner fallback.
- The locations table's Mitglied column now links too (it previously rendered plain text); this is the intended consistency win.
- A missing member always renders as a muted dash — no per-call-site fallback. A location without a member shows the dash even when it has a comment: the comment has its own column and must not pose as an owner.
- Each table that sorts or searches by member name carries a small row-enrichment `useMemo`. Accepted as the price of keeping comparators pure.
- Clothing items have no analogous single-name reference (they are identified by barcode/type/size), and Standort labels already have `formatClothingLocationLabel`; no equivalent component is needed for them.

## Alternatives rejected

- **`<MemberName>` that fetches by id per row (optionally via a flag):** issues one request per row, creates a second cache entry for members already in the list, and still cannot participate in sorting or search — the string consumers would keep the hook anyway, leaving two parallel lookup mechanisms.
- **Component-only (replace `useMemberNameLookup` everywhere):** impossible for search haystacks, sort comparators and `formatClothingLocationLabel`, which require strings, not React nodes.
- **Keeping per-call-site markup:** proven to drift — PR #342 needed three separate re-derivations of the same owner value, with the link/dash markup copied by hand.
