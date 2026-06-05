import type { UserRole } from "#/users/model/user.ts"

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
