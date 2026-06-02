import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useEffect, useRef } from "react"
import { useNavigate, useRouterState } from "@tanstack/react-router"

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
  const navigate = useNavigate()
  const location = useRouterState({ select: (s) => s.location })

  // Capture the href at mount time so the redirect target never changes even
  // if the router state updates while this component is still mounted.
  const mountHref = useRef(location.href)

  const hideChildOrDefault = props.hideChildComponent ?? false
  const errorOrDefault =
    props.forbiddenMessage ??
    "Du hast nicht die notwendigen Rechte diesen Bereich zu sehen"

  const isAuthenticated = data?.authenticated === true

  useEffect(() => {
    if (!isLoading && !isError && !isAuthenticated && !hideChildOrDefault) {
      void navigate({
        to: "/login",
        search: { redirect: mountHref.current },
        replace: true,
      })
    }
  }, [isLoading, isError, isAuthenticated, hideChildOrDefault, navigate])

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
  const hasRequiredRole = props.allowedRoles.some((role) =>
    userRoles.includes(role),
  )
  const hasAdminRole = userRoles.includes("ADMIN")

  if (!isAuthenticated) {
    return showChildOrNothing(hideChildOrDefault, null)
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
