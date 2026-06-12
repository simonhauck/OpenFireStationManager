# ADR-0006: PostgreSQL view for resolved clothing items

**Status:** Accepted
**Date:** 2026-06-12

## Context

`ResolvedClothingItem` bundles a `ClothingItem` with its `ClothingLocation` and `ClothingType`. Multiple services need this denormalised shape: `ClothingItemLookupService` (barcode lookup, search), `ClothingItemResolver` (single/batch resolution), and `InventoryReconciliationService` (preview). The assembly pattern across all these consumers loads items, types, and locations separately — either as individual `findById` lookups (N+1 per item) or as full-table loads into memory maps. This is correct but inefficient as the number of items grows.

A PostgreSQL view (`resolved_clothing_item_view`) that left-joins the three tables would reduce every resolution path to a single query.

## Decision

- Create `resolved_clothing_item_view` via V017 migration:
  ```sql
  CREATE VIEW resolved_clothing_item_view AS
  SELECT
    c_i.id AS item_id, ... ,
    c_l.id AS location_id, ... ,
    c_t.id AS type_id, ...
  FROM clothing_items c_i
  LEFT JOIN clothing_locations c_l ON c_l.id = c_i.location_id
  JOIN clothing_types c_t ON c_t.id = c_i.type_id
  ```
  All 12 metadata columns from the three tables are included with table-prefixed aliases.
- `ClothingItemResolver` owns all view access via `JdbcTemplate` + a custom `RowMapper` that hydrates `ResolvedClothingItem` from the flat row. Three methods: `resolveOne(id)`, `resolveAll()`, `resolveByBarcode(barcode)`.
- `ClothingItemResolver` drops its `ClothingItemRepository`, `ClothingTypeRepository`, and `ClothingLocationRepository` dependencies.
- `ClothingItemLookupService` drops `ClothingTypeRepository` and `ClothingLocationRepository`; its `findByBarcode` delegates to `resolveByBarcode` and its `search` method calls `resolveAll()` then filters by text and Kleiderwart visibility in-memory.
- The `ResolvedClothingItem` DTO shape (nested entities) remains unchanged — consumers see no difference.

### Why `JdbcTemplate` instead of Spring Data JDBC?

The view returns plain `Long?` columns for foreign keys, not `AggregateReference` objects. Spring Data JDBC cannot map the view to the existing entity classes. A custom `RowMapper` avoids creating a separate read-model entity class and keeps the mapping logic close to the query.

### Why `resolveAll()` for search instead of a filtered view query?

PostgreSQL views do not support parameterised filtering. `resolveAll()` loads all rows from the view, then the caller filters by text and visibility in Kotlin — same logic as the old `search()` method, same 50-result cap, but replacing three repository loads with one view query.

### Why not a materialised view?

The data volume is small (hundreds of clothing items, tens of locations, tens of types). A regular view computes the join at query time with negligible cost. A materialised view would add refresh management complexity for no performance gain.

## Consequences

- `ClothingItemLookupService.search()` still loads all items into memory but now as a single query instead of three.
- `ClothingItemResolver.resolveOne()` goes from up to 3 queries to 1.
- The view is read-only — write paths through `ClothingItemRepository`, `ClothingLocationRepository`, and `ClothingTypeRepository` are unaffected.
- A new pattern (`JdbcTemplate` + `RowMapper`) enters the codebase, previously used only in migrations.

## Alternatives Rejected

- **Keep in-memory assembly.** Works and is simple, but the N+1 query pattern scales poorly and `search()` already loads everything into memory anyway — a view eliminates the N+1 without adding complexity.
- **Materialised view.** Adds refresh management (triggers, cron, or manual refresh) for a dataset that fits in memory. No benefit at current scale.
- **Spring Data JDBC mapping to the view.** Requires `AggregateReference` fields that the view cannot produce because FK columns in the view are plain values, not references. Would need a new entity class anyway — `JdbcTemplate` is simpler.
