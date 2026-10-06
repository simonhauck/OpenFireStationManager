import { describe, expect, it } from "vitest"
import {
  formatClothingLocationLabel,
  formatClothingLocationLabelOrDefault,
} from "#/clothing/components/shared/clothingLocationLabel.ts"

const personalLocation = {
  name: "Spind 5",
  comment: "",
  type: "PERSONAL" as const,
}

describe("formatClothingLocationLabel", () => {
  it("shows the name alone when there is no member and no comment", () => {
    expect(formatClothingLocationLabel(personalLocation, undefined)).toBe(
      "Spind 5",
    )
  })

  it("shows name and member", () => {
    expect(formatClothingLocationLabel(personalLocation, "Hans Müller")).toBe(
      "Spind 5 – Hans Müller",
    )
  })

  it("shows name and comment when there is no member", () => {
    expect(
      formatClothingLocationLabel(
        { ...personalLocation, comment: "defekt" },
        undefined,
      ),
    ).toBe("Spind 5 – defekt")
  })

  it("shows name, member and comment", () => {
    expect(
      formatClothingLocationLabel(
        { ...personalLocation, comment: "defekt" },
        "Hans Müller",
      ),
    ).toBe("Spind 5 – Hans Müller – defekt")
  })

  it("appends the type suffix to the name alone when requested", () => {
    expect(
      formatClothingLocationLabel(personalLocation, undefined, {
        showType: true,
      }),
    ).toBe("Spind 5 (Persönlicher Standort)")
  })

  it("appends the type suffix when requested", () => {
    expect(
      formatClothingLocationLabel(
        { ...personalLocation, comment: "defekt" },
        "Hans Müller",
        { showType: true },
      ),
    ).toBe("Spind 5 – Hans Müller – defekt (Persönlicher Standort)")
  })
})

describe("formatClothingLocationLabelOrDefault", () => {
  it("falls back to the default when the location is undefined", () => {
    expect(formatClothingLocationLabelOrDefault(undefined, undefined)).toBe("–")
  })

  it("formats the location when present", () => {
    expect(
      formatClothingLocationLabelOrDefault(
        { ...personalLocation, comment: "defekt" },
        "Hans Müller",
      ),
    ).toBe("Spind 5 – Hans Müller – defekt")
  })
})
