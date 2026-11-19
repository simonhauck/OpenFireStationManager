import { describe, expect, it } from "vitest"
import { buildCrumbs, segmentLabel } from "./breadcrumbModel"

describe("segmentLabel", () => {
  it("maps known static segments to their German label", () => {
    expect(segmentLabel("members")).toBe("Mitglieder")
    expect(segmentLabel("clothing-management")).toBe("Klamotten Management")
    expect(segmentLabel("new")).toBe("Neu")
  })

  it("returns the raw value for dynamic or unknown segments", () => {
    expect(segmentLabel("42")).toBe("42")
    expect(segmentLabel("some-unknown-segment")).toBe("some-unknown-segment")
  })
})

describe("buildCrumbs", () => {
  const patterns = [
    "/members",
    "/members/new",
    "/members/$memberId/edit",
    "/clothing-management/types",
  ]

  it("returns no crumbs for the root path", () => {
    expect(buildCrumbs("/", patterns)).toEqual([])
  })

  it("builds cumulative hrefs with translated labels", () => {
    const crumbs = buildCrumbs("/clothing-management/types", patterns)

    expect(crumbs).toEqual([
      {
        label: "Klamotten Management",
        href: "/clothing-management",
        isLinked: false,
      },
      { label: "Typen", href: "/clothing-management/types", isLinked: true },
    ])
  })

  it("marks a segment as linked when a route pattern matches it", () => {
    const crumbs = buildCrumbs("/members/new", patterns)

    expect(crumbs[0]).toMatchObject({
      label: "Mitglieder",
      href: "/members",
      isLinked: true,
    })
    expect(crumbs[1]).toMatchObject({ label: "Neu", isLinked: true })
  })

  it("matches dynamic route patterns against concrete path values", () => {
    const crumbs = buildCrumbs("/members/42/edit", patterns)

    expect(crumbs.map((crumb) => crumb.isLinked)).toEqual([true, false, true])
    expect(crumbs[1].label).toBe("42")
  })

  it("does not link a prefix that is not itself a registered route", () => {
    const crumbs = buildCrumbs("/members/unknown", patterns)

    expect(crumbs[1]).toMatchObject({ href: "/members/unknown" })
    expect(crumbs[1].isLinked).toBe(false)
  })
})
