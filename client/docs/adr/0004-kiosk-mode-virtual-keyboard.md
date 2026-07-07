# ADR-0004: Kiosk mode with on-screen keyboard

**Status:** Accepted
**Date:** 2026-07-07

## Context

The application is deployed on touchscreen devices (Raspberry Pi running Chromium in kiosk
mode) that have no physical keyboard. Operators need to type into search fields, form inputs,
and textareas across any route. The keyboard must appear automatically when an input gains
focus and disappear when it loses focus, with zero per-input configuration.

## Decision

Kiosk mode is a device-level setting, not a route-level or role-level concept. It is activated
by an admin toggle on `/admin/settings` and persisted in `localStorage` under the key `kiosk`.

The implementation has four pieces:

1. **`KioskProvider`** — a React context provider mounted at the app root. When kiosk mode is
   active, it attaches a global `focusin` listener on `document`. When the focused element is
   an `input`, `textarea`, or `[contenteditable]`, it sets keyboard state to `open`. A `focusout`
   listener sets it to `closed`.

2. **`KioskKeyboard`** — a component using `react-simple-keyboard` that renders the virtual
   keyboard at the bottom of the viewport. It reads the active element from `KioskProvider` and
   sends keystrokes to `document.activeElement` by dispatching synthetic `KeyboardEvent`s and
   manipulating the element's `value` property. When open, the keyboard pushes page content
   upward (viewport shrinks) rather than overlaying it.

   Layout: German QWERTZ with a numeric keypad as a secondary layer. Key size follows the
   existing Material 48dp minimum tap-target convention.

3. **Admin settings toggle** — a shadcn `Switch` component added to the `AdminSettingsPage`
   under a new "Kiosk Modus" sub-section. Reads/writes `localStorage` directly and notifies
   `KioskProvider` via a custom event.

4. **Native keyboard suppression** — not required. Chromium on Raspberry Pi in kiosk mode does
   not show a native on-screen keyboard.

The keyboard height is dynamic: computed from the number of layout rows × the configured key
height (48px default). This avoids hardcoding a pixel value that breaks on different display
resolutions.

## Consequences

- The `focusin`/`focusout` listeners introduce a small per-event overhead on every focus change
  across the app. This is negligible for a single-page app on dedicated hardware.
- The keyboard blinks in/out between inputs in multi-field forms (e.g. user creation with 5
  fields). Acceptable trade-off vs. the complexity of a manual-dismiss variant.
- The `ClothingItemScanner` global keydown listener already ignores INPUT/TEXTAREA targets.
  No change required — scanner keystrokes are ignored while the keyboard is open.
- If a future deployment runs on a device that _does_ show a native keyboard (e.g. iPad),
  additional suppression logic will be needed. That is out of scope for now.

## Alternatives rejected

- **`inputmode="none"` for native keyboard suppression.** Inconsistent support across
  platforms; not needed for the current Chromium-on-Pi target.
- **Route-scoped kiosk mode (tablet routes only).** Rejected in favour of a global setting
  for maximum flexibility. A wall-mounted admin terminal without a keyboard should also work.
- **URL query parameter (`?kiosk=1`).** Visible in the address bar, can be accidentally
  removed. localStorage survives refreshes and is invisible to the operator.
- **Session-only (`sessionStorage`).** Would require re-enabling after every kiosk reboot.
  localStorage survives across browser restarts.
- **Fixed pixel keyboard height.** Breaks on displays with different resolutions. Dynamic
  height computed from layout rows is resolution-independent.
- **Build-time kiosk flag (`VITE_KIOSK_MODE`).** Requires a separate build per deployment
  type. Runtime toggle via admin settings allows the same build to serve both desktop and
  kiosk devices.
- **Custom keyboard from scratch.** `react-simple-keyboard` is mature (4.5k GitHub stars),
  themeable, supports custom layouts, and handles edge cases (key repeat, shift modifier,
  touch events). Building from scratch is unnecessary.
- **Per-input wrapper component (`<KioskInput>`).** Would require migrating ~15+ Input
  usages across 8+ files and enforcing the wrapper going forward. Global focus listener is
  zero-cost for existing code.
