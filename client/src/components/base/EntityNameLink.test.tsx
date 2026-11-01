/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { meQuery } from "#/api/auth.queries"
import type { AuthStateResponse } from "#/api/model/auth"
import type { UserRole } from "#/users/model/user.ts"
import EntityNameLink from "./EntityNameLink"

afterEach(cleanup)

function renderLink(roles: UserRole[], enabled = true) {
  const queryClient = new QueryClient()
  const authState: AuthStateResponse = {
    authenticated: true,
    user: {
      username: "test-user",
      firstName: "Test",
      lastName: "User",
      roles,
      enabled: true,
      id: 1,
      metaData: {
        createdAt: "2026-01-01T00:00:00Z",
        createdBy: "System",
        lastModifiedAt: "2026-01-01T00:00:00Z",
        lastModifiedBy: "System",
      },
    },
  }
  queryClient.setQueryData(meQuery().queryKey, authState)

  render(
    <QueryClientProvider client={queryClient}>
      <EntityNameLink
        href="/members/1"
        allowedRoles={["KLEIDERWART"]}
        enabled={enabled}
      >
        Max Mustermann
      </EntityNameLink>
    </QueryClientProvider>,
  )
}

describe("EntityNameLink", () => {
  it("renders a link when the user holds a required role", () => {
    renderLink(["KLEIDERWART"])

    expect(
      screen.getByRole("link", { name: "Max Mustermann" }).getAttribute("href"),
    ).toBe("/members/1")
  })

  it("treats ADMIN as holding every required role", () => {
    renderLink(["ADMIN"])

    expect(
      screen.getByRole("link", { name: "Max Mustermann" }).getAttribute("href"),
    ).toBe("/members/1")
  })

  it("renders plain text when the user lacks the required role", () => {
    renderLink(["USER"])

    expect(screen.getByText("Max Mustermann")).not.toBeNull()
    expect(screen.queryByRole("link")).toBeNull()
  })

  it("renders plain text when linking is disabled", () => {
    renderLink(["KLEIDERWART"], false)

    expect(screen.getByText("Max Mustermann")).not.toBeNull()
    expect(screen.queryByRole("link")).toBeNull()
  })
})
