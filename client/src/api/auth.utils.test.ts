import { describe, expect, it } from "vitest"
import { hasRequiredRole } from "./auth.utils"

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
