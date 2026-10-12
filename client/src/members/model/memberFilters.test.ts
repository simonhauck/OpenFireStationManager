import { describe, expect, it } from "vitest"
import type { ClothingLocation } from "#/clothing/model/clothingLocations.ts"
import type { Member } from "#/members/model/member.ts"
import {
  filterMembers,
  formatCount,
  hasDuplicateMemberName,
} from "./memberFilters"

const META_DATA = {
  createdAt: "2026-01-02T00:00:00Z",
  createdBy: "System",
  lastModifiedAt: "2026-01-02T00:00:00Z",
  lastModifiedBy: "System",
}

function member(id: number, name: string): Member {
  return { id, name, metaData: META_DATA }
}

function location(id: number, name: string): ClothingLocation {
  return {
    id,
    name,
    comment: "",
    onlyVisibleForKleiderwart: false,
    type: "PERSONAL",
    metaData: META_DATA,
  }
}

describe("filterMembers", () => {
  const members = [member(1, "Hans Müller"), member(2, "Anna Schmidt")]

  it("returns every member when the search term is empty", () => {
    expect(filterMembers(members, new Map(), "")).toEqual(members)
  })

  it("matches members by name, case-insensitively", () => {
    expect(filterMembers(members, new Map(), "anna")).toEqual([members[1]])
  })

  it("matches members by the name of one of their Standorte", () => {
    const locations = new Map([[1, [location(10, "Spind 5")]]])

    expect(filterMembers(members, locations, "spind")).toEqual([members[0]])
  })

  it("requires every comma-separated term to match", () => {
    const locations = new Map([
      [1, [location(10, "Spind 5")]],
      [2, [location(11, "Lager")]],
    ])

    expect(filterMembers(members, locations, "hans, spind")).toEqual([
      members[0],
    ])
    expect(filterMembers(members, locations, "hans, lager")).toEqual([])
  })
})

describe("hasDuplicateMemberName", () => {
  const members = [member(1, "Hans Müller")]

  it("detects a duplicate regardless of case and surrounding whitespace", () => {
    expect(hasDuplicateMemberName(members, "  hans müller ")).toBe(true)
  })

  it("returns false when no member has the name", () => {
    expect(hasDuplicateMemberName(members, "Anna Schmidt")).toBe(false)
  })
})

describe("formatCount", () => {
  it("uses the singular noun for exactly one", () => {
    expect(formatCount(1, "Standort", "Standorte")).toBe("1 Standort")
  })

  it("uses the plural noun for any other count", () => {
    expect(formatCount(0, "Kleidungsstück", "Kleidungsstücke")).toBe(
      "0 Kleidungsstücke",
    )
    expect(formatCount(2, "Standort", "Standorte")).toBe("2 Standorte")
  })
})
