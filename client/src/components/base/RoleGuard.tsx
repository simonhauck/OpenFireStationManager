import { useQuery } from "@tanstack/react-query"
import React from "react"
import type { ReactNode } from "react"

import { meQuery } from "#/api/auth.queries"
import { hasRequiredRole } from "#/api/auth.utils"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import type { UserRole } from "#/users/model/user.ts"

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

  if (!isAuthenticated) {
    return showChildOrNothing(
      hideChildOrDefault,
      <ErrorState message={errorOrDefault} />,
    )
  }

  if (!hasRequiredRole(userRoles, props.allowedRoles)) {
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
