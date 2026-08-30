
# ADR-0007: Member as an entity separate from UserAccount

**Status:** Accepted
**Date:** 2026-08-30

## Context

Until now the codebase had no notion of a person. `server/CONTEXT.md` stated the position explicitly: *"There is no separate 'Firefighter' entity — every user is a potential firefighter."* Ownership of a locker was expressed informally, by typing the owner's name into the free-text `comment` field of a `PERSONAL` `ClothingLocation`.

That model broke down against three facts about the deployment:

1. **Most people have no login.** A station has on the order of sixty people who are issued clothing and perhaps a handful who ever sign in. Requiring a `UserAccount` per person would mean creating dozens of credentials that must never be used.
2. **Some logins have no person.** Tablets in the station run shared accounts. ADR-0001 already records the consequence — `ClothingMovement.performedByUserId` is the account that submitted the request, not the human who acted.
3. **Person-specific attributes have nowhere to live.** A desired clothing size belongs to a human. On a shared tablet account it is meaningless.

The obvious cheaper alternative was to relax `UserAccount`: make `username` and `passwordHash` nullable, treat a credential-less row as a person, and reuse the existing `AdminUserController` CRUD.

## Decision

Introduce a `Member` aggregate in its own table, entirely separate from `users`.

- **`Member(name, id, metaData)`.** A single free-text `name` ("Hans Müller"), not `firstName`/`lastName`. `name` is **not unique**.
- **No link to `UserAccount`.** A nullable `member.user_id` FK was designed and deliberately deferred — see below.
- **`clothing_locations.member_id`** — nullable FK, modelled as `AggregateReference<Member, Long>`. One member owns many locations; a location has at most one member. Only `PERSONAL` locations may carry a member; the service rejects a `memberId` on any other type, and rejects changing a location's type away from `PERSONAL` while a member is attached rather than silently clearing the owner.
- **The association is written from the location side only.** `Member` views list locations read-only and link through to the location edit page. `MemberService` never writes rows in the `clothing_locations` aggregate.
- **API `/api/members`** — reads open to any authenticated user, writes `KLEIDERWART`. Deleting a member unassigns their locations (`SET NULL`) rather than returning 409; the client warns first.

### Why not relax `UserAccount` instead?

Every row in `users` being a credential that can authenticate is a security invariant, load-bearing for `UserDetailsServiceImpl`, `findByUsername`, `existsByUsername`, and remember-me. Introducing rows that must never authenticate puts the system one missed null-check away from a hole, in the one table where that class of bug is most expensive. A separate table keeps the invariant intact by construction.

It also does not actually solve the problem: shared tablet accounts would still be `UserAccount` rows with no person behind them, so "row in `users`" and "human" would remain different sets — just less visibly so.

### Why is there no FK between them?

The link buys no behaviour today. Nothing in the current feature set asks "which login is this person?", and deferring it keeps this change smaller. It stays cheap to add: a nullable column plus a one-off name match against `users.first_name || ' ' || users.last_name`, which works as well later as now because member names are preserved verbatim.

When it is added, the intended shape is a **unique** `member.user_id` — one human, at most one login. There is no case for a person holding both a personal and an admin account, since `UserDetailsServiceImpl` already grants an `ADMIN` every other role implicitly.

### Why one `name` field instead of `firstName`/`lastName`?

The existing locker comments are already written as "Vorname Nachname", so a single field migrates verbatim with zero parsing (see ADR-0008). Splitting would require inferring a boundary in free text and would produce un-editable rows for single-token entries if `firstName` were `@NotBlank` like it is on `UserAccount`.

### Why is `name` not unique?

Two people in one organisation genuinely can share a name — a father and son in the same Feuerwehr is not exotic — and a constraint would make the second unrepresentable. Note this is *not* inconsistent with ADR-0008's dedupe-by-name: for pre-existing locker comments an identical string almost certainly means the same person, which is a safe retrospective inference but a wrong forward-looking rule. Duplicate prevention, if wanted, belongs in a client-side warning.

## Consequences

- `UserAccount.firstName`/`lastName` and `Member.name` describe overlapping humans in two tables with **no synchronisation and no FK**. This is deliberate: the former is the display name of a *login* (for a shared tablet account, not a person's name at all), the latter the name of a *person*.
- `ClothingLocation` gains a field, and it is hydrated in **two** places — from its own table by Spring Data JDBC, and from `resolved_clothing_item_view` by `ClothingItemResolver.buildClothingLocation`. Both must be updated, or locations embedded in a `ResolvedClothingItem` come back with a null member. The view was created with a plain `CREATE VIEW`, so it needs a `DROP`/`CREATE OR REPLACE`.
- Only `memberId` crosses the wire; the client resolves names from the members list, which it needs anyway for the location form's member picker, the member views, and the delete warning. `formatClothingLocationLabel` gains a member argument, forcing updates at its ~14 call sites — compiler-enforced, so none can be missed.
- A `KLEIDERWART` can create and delete members. If a `member.user_id` link is added later, this means a Kleiderwart could decide which login is which person. Acceptable — a Kleiderwart can already relocate every item in the building — but worth revisiting when the link lands.
- Members are hard-deleted, not deactivated. `ClothingMovement` history references locations and never members, so deleting a member destroys no audit trail.

## Alternatives Rejected

- **Relax `UserAccount` to allow credential-less rows.** Cheapest in code, but breaks the "every row in `users` can authenticate" invariant and still leaves person-less shared accounts. See above.
- **Name the concept `Firefighter`.** Rejected because the set is the whole organisation — Jugendfeuerwehr, Alterskameraden, and administrative staff can all be issued clothing. `Firefighter` becomes a lie the first time a Jugendfeuerwehr member gets a locker, and renaming a table is worse than naming it right. German UI label: "Mitglied".
- **Put the FK on `users` (`users.member_id`).** Moot now the link is deferred, but rejected on principle: `users` is the security-critical table and `Member` is the dependent concept, so the pointer belongs on `members`.
- **Write the location association from the member side.** Reads more naturally given the concept is described member-first, but `MemberService` would be mutating the `clothing_locations` aggregate and two services could write the same column. Rejected in favour of a single write path; the member-centric *view* is preserved read-only.
- **Denormalise `memberName` onto the `ClothingLocation` response.** Would avoid touching the label helper's call sites, but puts a derived non-persisted field on the entity, and the client needs the members list regardless for three other purposes.
