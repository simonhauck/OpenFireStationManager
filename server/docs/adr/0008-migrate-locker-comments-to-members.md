
# ADR-0008: Migrating locker comments to members

**Status:** Accepted
**Date:** 2026-08-30

## Context

Before `Member` existed (ADR-0007), locker ownership was recorded by typing the owner's name into the free-text `comment` field of a `PERSONAL` `ClothingLocation` — rendered by the client as `"Spind 5 – Hans Müller"`. In the live deployment this convention was followed consistently: where a personal locker has an owner, the owner's name is in the comment, written as "Vorname Nachname".

That makes the existing data a usable source for the initial member population, avoiding manual re-entry of roughly sixty people. It is also the only bulk-load path — no batch import UI is planned for members, because after this migration they arrive one at a time.

Inspection of the live data showed the convention is not universal: some locations typed `PERSONAL` are not personal at all but pool storage, identifiable by "Pool" appearing in the location name or the comment.

## Decision

A one-off data migration creates one `Member` per distinct owner name found on qualifying locations, links the locations to it, and clears the comments it consumed.

**Predicate:**

```sql
WHERE type = 'PERSONAL'
  AND TRIM(comment) <> ''
  AND comment NOT ILIKE '%pool%'
  AND name    NOT ILIKE '%pool%'
```

- **`PERSONAL` only.** Only personal locations can carry a member at all.
- **Non-empty comment.** A blank comment cannot produce a named member; those locations are skipped and keep their empty comment.
- **A "pool" match in *either* field disqualifies the row.** These are pool storage mistyped as `PERSONAL`; their comments are not people.
- **Substring, not word boundary.** `ILIKE '%pool%'` also matches "Poolraum" or "Ersatzpool". A German surname containing "pool" is not a realistic concern, and the asymmetry favours caution: excluding wrongly is fixable by assigning the member by hand, whereas including wrongly is exactly what the rule guards against.

**Name handling:** the comment is copied **verbatim** into `member.name`. No parsing into first/last name — see ADR-0007.

**Dedupe:** locations whose comments match on trimmed, case-insensitive comparison produce **one** member owning several locations, not one member per locker. People with more than one locker are the expected case, not an anomaly.

**Comment clearing:** the comment is cleared on every location that produced a member. Locations excluded by the predicate keep theirs.

## Consequences

- **The migration is one-way.** It is safe nonetheless, because the comment text is *moved* rather than destroyed — every character survives verbatim as `member.name`. Nothing needs to be recovered; at worst something needs to be re-filed.
- **Expect residue.** A `PERSONAL` locker whose comment was never a name (e.g. "defekt") becomes a junk member. Plan on reviewing the member list once after deployment. Cleanup is cheap: deleting a member unassigns their locations rather than blocking (ADR-0007), so removing a junk member has no side effects.
- **Names are frozen at migration time.** Later edits to a member's name do not propagate anywhere, and later edits to a location's comment no longer imply ownership. The comment reverts to what it always nominally was — generic free text ("defekt", "hinten links").
- **The tablet UI does not regress.** `formatClothingLocationLabel` prefers the linked member's name and falls back to the comment, showing both when both are present, so migrated and un-migrated lockers both render an owner in the checkout, return, relocation, and inventory wizards.
- **Dedupe-by-name here does not imply a uniqueness constraint on `Member.name`.** The API deliberately permits duplicates (ADR-0007); this migration's inference is retrospective only.

## Alternatives Rejected

- **Leave the comments in place and enter members by hand.** Loses nothing but costs an afternoon of transcription and would leave the same name in two places indefinitely, with no rule about which is authoritative.
- **Copy the comment but do not clear it.** Considered as the safer option, on the grounds that the parse might be wrong. Rejected once the rule became a verbatim copy: there is no parse to get wrong, so the only effect would be showing every migrated owner's name twice, with the usual fate of "clean it up later".
- **Parse into `firstName` / `lastName`.** Rejected with the field split itself — see ADR-0007.
- **No dedupe: one member per locker.** Would guarantee a wrong result for every member with two lockers, which is the more common case here than two distinct people sharing a full name.
- **Auto-link migrated members to `UserAccount` by name match.** Designed — link where exactly one enabled user matches `first_name || ' ' || last_name` — and then dropped along with the FK itself (ADR-0007). It remains available later at the same cost, since member names are preserved verbatim.
