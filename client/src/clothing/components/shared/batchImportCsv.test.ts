import { describe, expect, it } from "vitest"
import {
  parseClothingItemsCsv,
  parseClothingLocationsCsv,
} from "./batchImportCsv"

describe("parseClothingItemsCsv", () => {
  it("parses size and barcode pairs", () => {
    expect(parseClothingItemsCsv("L,123456\nM,789")).toEqual({
      rows: [
        { size: "L", barcode: "123456", manufacturerBarcode: undefined },
        { size: "M", barcode: "789", manufacturerBarcode: undefined },
      ],
      errors: [],
    })
  })

  it("parses an optional manufacturer barcode as the third column", () => {
    expect(parseClothingItemsCsv("L,123456,4006\nM,,4007")).toEqual({
      rows: [
        { size: "L", barcode: "123456", manufacturerBarcode: "4006" },
        { size: "M", barcode: "", manufacturerBarcode: "4007" },
      ],
      errors: [],
    })
  })

  it("treats a missing barcode as undefined", () => {
    expect(parseClothingItemsCsv("XL")).toEqual({
      rows: [
        { size: "XL", barcode: undefined, manufacturerBarcode: undefined },
      ],
      errors: [],
    })
  })

  it("ignores blank lines and trims cells", () => {
    expect(parseClothingItemsCsv("  L , 42 \n\n  \nM,7")).toEqual({
      rows: [
        { size: "L", barcode: "42", manufacturerBarcode: undefined },
        { size: "M", barcode: "7", manufacturerBarcode: undefined },
      ],
      errors: [],
    })
  })

  it("reports an error with the line number for an empty size", () => {
    expect(parseClothingItemsCsv("L,1\n,\nM,2")).toEqual({
      rows: [
        { size: "L", barcode: "1", manufacturerBarcode: undefined },
        { size: "M", barcode: "2", manufacturerBarcode: undefined },
      ],
      errors: ["Zeile 2: Größe darf nicht leer sein."],
    })
  })
})

describe("parseClothingLocationsCsv", () => {
  it("parses name and comment pairs", () => {
    expect(parseClothingLocationsCsv("Spind 1,Kommentar A\nSpind 2")).toEqual({
      rows: [
        { name: "Spind 1", comment: "Kommentar A" },
        { name: "Spind 2", comment: "" },
      ],
      errors: [],
    })
  })

  it("reports an error with the line number for an empty name", () => {
    expect(parseClothingLocationsCsv(",Kommentar\nSpind 1")).toEqual({
      rows: [{ name: "Spind 1", comment: "" }],
      errors: ["Zeile 1: Bezeichnung darf nicht leer sein."],
    })
  })
})
