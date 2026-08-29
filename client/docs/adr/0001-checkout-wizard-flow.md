
# ADR-0001: Checkout wizard step order and auto-toggle returns

**Status:** Accepted
**Date:** 2026-04-29

## Context

The `/pool-clothing/checkout` route is a guided wizard for firefighters on a touch tablet. The naive ordering — pick target → pick returns → pick takes — forces the user to remember what they're returning before deciding what they're taking. In practice the trigger for a return is usually the take itself: "I'm taking a clean jacket, so I should return my dirty one." Ordering the take step first lets the wizard help the user with the return step.

## Decision

Wizard steps in fixed order:

1. **Pick target PERSONAL location** — searchable Combobox (>100 candidates expected).
2. **Pick items to take** — barcode scanner primary, searchable Combobox as backup.
3. **Return step (always shown)** — lists every item currently at the chosen PERSONAL location with a per-item return toggle. Items are pre-toggled by **type match (strict, loose count)**: every existing item whose `ClothingType` equals the type of any item being taken is toggled on. Size is not considered (an exchange-for-a-different-size still triggers the auto-toggle). The user can freely adjust toggles.
4. **Pick WAESCHE return target** — tile grid, single tap. Only shown if at least one item is toggled in step 3.
5. **Review** — single screen showing all returns and takes with their target locations. Single "Confirm" button submits to the API.
6. **Submit** — calls `POST /api/clothing/checkouts`. The server responds with `{ batchId }` on success, or `409 Conflict` if an item is not where the server expects it. If the server returns 409, a toast error is shown and the user remains on the review screen.

The wizard is a single TanStack Router route (`/pool-clothing/checkout`) with internal step state. No sub-routes, no search-param-driven steps. Browser back exits the wizard; this is intentional for a transactional flow.

## Consequences

- The return step is reached via a known sequence, not by branching on locker content. Empty lockers still see the step; they will see an empty list and tap "next".
- Auto-toggling by type-only with no quantity cap means a user taking 1 jacket sees all N existing jackets pre-toggled. They mass-untoggle if they want to return fewer. This favours over-suggesting returns over under-suggesting — recovering from over-suggestion is cheaper.
- The Review screen carries the cost of one extra tap per checkout in exchange for a confirmation safety net before the irreversible action.
- The wizard state lives in component state. There is no resume-after-reload behaviour; refreshing the page restarts the wizard.

## Alternatives rejected

- **Sub-routes per step.** TanStack Router file-based routes per step (`/pool-clothing/checkout/target`, `/pool-clothing/checkout/take`, ...). Browser back navigates between steps; deep-linking to a step is possible. Rejected: deep-linking to step 3 is meaningless without state from steps 1–2; back-button mid-wizard is a footgun on a tablet.
- **Search params for step state** (`/pool-clothing/checkout?step=3`). Middle ground; rejected as added complexity for no user benefit on a non-deep-linkable flow.
- **Returns before takes** (the original plan ordering). Forces the user to predict what they'll need to return without knowing what they're taking; defeats auto-toggle by type-match.
- **Auto-toggle returns by type + size.** Misses the exchange-for-different-size case, which is one of the main reasons users return clothing. Type-only catches both same-size and exchange cases.
- **Quantity-matched auto-toggle (toggle N existing items when taking N of that type).** Requires a heuristic to pick which existing items; the user has to disagree with the heuristic when it's wrong. Loose toggle-all is simpler and the user adjusts on the same screen.
- **Auto-skip the return step when the locker is empty or nothing matches.** Saves one tap in rare cases at the cost of a non-deterministic wizard shape. Always-show keeps the flow predictable.
