import type { UserRole } from "#/users/model/user.ts"

/** Server endpoint that starts the OpenID Connect sign-in (a top-level navigation). */
export const LOGIN_ENTRY_POINT = "/api/public/auth/login"

/** Server endpoint that ends the session; submit it as a top-level form `POST`. */
export const LOGOUT_ENDPOINT = "/api/public/auth/logout"

/**
 * Returns true if the user has at least one of the required roles.
 * ADMIN always passes regardless of requiredRoles.
 */
export function hasRequiredRole(
  userRoles: UserRole[],
  requiredRoles: UserRole[],
): boolean {
  if (userRoles.includes("ADMIN")) return true
  return requiredRoles.some((role) => userRoles.includes(role))
}

/**
 * Builds the URL of the login entry point that returns to `redirect` after signing in.
 * The server only accepts relative paths and falls back to the dashboard otherwise.
 */
export function loginUrl(redirect?: string): string {
  if (!redirect) return LOGIN_ENTRY_POINT
  return `${LOGIN_ENTRY_POINT}?redirect=${encodeURIComponent(redirect)}`
}
