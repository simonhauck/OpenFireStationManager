import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { meQuery } from "#/api/auth.queries"
import type { components } from "#/api/schema"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"

type UserRole = components["schemas"]["UserAccount"]["roles"][number]

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: ReactNode
  forbiddenMessage?: string
}

export default function RoleGuard({
  allowedRoles,
  children,
  forbiddenMessage = "Sie haben keine Berechtigung für diesen Bereich.",
}: RoleGuardProps) {
  const { data, isLoading, isError } = useQuery(meQuery())

  if (isLoading) {
    return <LoadingIndicator label="Berechtigungen werden geprüft..." />
  }

  if (isError) {
    return <ErrorState message="Berechtigung konnte nicht geprüft werden." />
  }

  const userRoles = data?.user?.roles ?? []
  const isAuthenticated = data?.authenticated === true
  const hasRequiredRole = allowedRoles.some((role) => userRoles.includes(role))

  if (!isAuthenticated || !hasRequiredRole) {
    return <ErrorState message={forbiddenMessage} />
  }

  return <>{children}</>
}
