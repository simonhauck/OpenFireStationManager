import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { meQuery } from "#/api/auth.queries"
import type { components } from "#/api/schema"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"

type UserRole = components["schemas"]["UserAccount"]["roles"][number]

export interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: ReactNode
  forbiddenMessage?: string
  hideChildComponent?: boolean
}

export default function RoleGuard(props: RoleGuardProps) {
  const { data, isLoading, isError } = useQuery(meQuery())

  const hideChildOrDefault = props.hideChildComponent ?? false
  const errorOrDefault =
    props.forbiddenMessage ??
    "Du hast nicht die notwendigen Rechte diesen Bereich zu sehen"

  if (isLoading) {
    return showChildOrNothing(
      hideChildOrDefault,
      <LoadingIndicator label="Berechtigungen werden geprüft..." />,
    )
  }

  if (isError) {
    return showChildOrNothing(
      hideChildOrDefault,
      <ErrorState message="Berechtigung konnte nicht geprüft werden." />,
    )
  }

  const userRoles = data?.user?.roles ?? []
  const isAuthenticated = data?.authenticated === true
  const hasRequiredRole = props.allowedRoles.some((role) =>
    userRoles.includes(role),
  )
  const hasAdminRole = userRoles.includes("ADMIN")

  if (!isAuthenticated && !props.hideChildComponent) {
    return showChildOrNothing(
      hideChildOrDefault,
      <ErrorState message={errorOrDefault} />,
    )
  }

  if (!(hasRequiredRole || hasAdminRole)) {
    return showChildOrNothing(
      hideChildOrDefault,
      <ErrorState message={errorOrDefault} />,
    )
  }

  return <>{props.children}</>
}

function showChildOrNothing(hide: boolean, children: React.ReactNode) {
  if (hide) return <></>

  return <>{children}</>
}
