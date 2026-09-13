
# ADR-0009: Optional, not nullable-and-optional, fields in the OpenAPI contract

**Status:** Accepted
**Date:** 2026-09-13

## Context

`ClothingLocation.memberId` was declared as a nullable Kotlin property and annotated with an
explicit null type:

```kotlin
@field:Schema(
    implementation = Long::class,
    types = ["integer", "null"],
    description = "Id of the member who owns this location. …",
)
val memberId: AggregateReference<Member, Long>? = null,
```

The property has a Kotlin default, so SpringDoc left it out of the OpenAPI `required` list while
the `types` array still advertised `null`. The generated TypeScript therefore became:

```ts
memberId?: number | null
```

That is the **only** property in the whole contract that is both optional and nullable, so every
caller had to handle two distinct spellings of "absent" — `undefined` and `null` — for the same
concept. Review feedback on the member-ownership change flagged the duplication.

Every other nullable field in the codebase already resolves this the other way. `ClothingItem`
declares `locationId` and `barcode` as nullable Kotlin properties annotated with
`implementation = …` only, and they generate as `locationId?: number` and `barcode?: string`:
optional, and `undefined`-only. The client's own `AGENTS.md` states the preference — "Prefer
`undefined` over `null` for absent values" — but the contract had no rule to keep generated
bindings consistent with it.

## Decision

A field that may be absent is modelled as **optional and not nullable** in the OpenAPI contract.

- Declare the Kotlin property nullable with a default (`val memberId: AggregateReference<Member, Long>? = null`).
- Annotate it with `@field:Schema(implementation = Long::class, …)` and nothing else. Do **not**
  add `types = ["integer", "null"]` (or any equivalent null type).
- Leave it out of the OpenAPI `required` list — which SpringDoc does automatically for a property
  with a default.

The generated TypeScript is then `memberId?: number`, matching `ClothingItem.locationId` and
`.barcode`. On the wire, Kotlin's default makes an omitted field and an explicit `null`
indistinguishable, which is exactly the semantics the full-replacement `PATCH` endpoints already
rely on: omitting a field clears it.

## Consequences

- Generated TypeScript bindings never contain `x?: T | null`. The only place `null` can appear in
  a generated type is a field that is genuinely required-but-nullable, and no such field exists.
- "Absent" has exactly one spelling in the generated client: `undefined`. Client code drops the
  `?? null` fallback that the duplicated type forced it to carry.
- The API contract no longer documents `null` as an accepted value, even though Jackson still
  deserialises an explicit JSON `null` into the Kotlin default. Callers that send `null` are not
  wrong, but the documented and generated shape is the optional one.
- This is a server-side annotation rule; the client-side effect is automatic on the next
  `npm run prepareEnv`. There is no client-side change to make beyond regenerating.

## Alternatives Rejected

- **Required-and-nullable (`memberId: number | null`).** Would remove `undefined` by making the
  field mandatory, but forces every caller to always send a value — including creation, where the
  field is meaningless — and pushes `null` into the generated types against the client's stated
  preference. Rejected in favour of the pattern the rest of the contract already uses.
- **Keep `memberId?: number | null` and handle both in each client.** Leaks a schema defect into
  every consumer and guarantees the two spellings drift. The fix belongs in the contract, not in
  each caller.
- **Remove nullability from the Kotlin type entirely.** The domain genuinely allows a personal
  location with no owner, so the property must remain nullable in Kotlin. Only the OpenAPI
  representation changes.
