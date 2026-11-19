import { describe, expect, it } from "vitest"
import { hasRequiredRole, loginUrl } from "./auth.utils"

describe("hasRequiredRole", () => {
  it("returns true when the user holds one of the required roles", () => {
    expect(hasRequiredRole(["USER", "KLEIDERWART"], ["KLEIDERWART"])).toBe(true)
  })

  it("treats ADMIN as holding every role", () => {
    expect(hasRequiredRole(["ADMIN"], ["KLEIDERWART"])).toBe(true)
  })

  it("returns false when the user holds none of the required roles", () => {
    expect(hasRequiredRole(["USER"], ["KLEIDERWART", "ADMIN"])).toBe(false)
  })

  it("returns false for an empty role list unless the user is an admin", () => {
    expect(hasRequiredRole([], ["KLEIDERWART"])).toBe(false)
    expect(hasRequiredRole(["ADMIN"], [])).toBe(true)
  })
})

describe("loginUrl", () => {
  it("passes the return path to the login entry point", () => {
    expect(loginUrl("/pool-clothing/return?returnTarget=POOL")).toBe(
      "/api/public/auth/login?redirect=%2Fpool-clothing%2Freturn%3FreturnTarget%3DPOOL",
    )
  })

  it("omits the return path when there is none", () => {
    expect(loginUrl()).toBe("/api/public/auth/login")
  })
})
