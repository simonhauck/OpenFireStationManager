/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import type { ImpressumDto } from "#/legal/model/legal"
import ImpressumDetails from "./ImpressumDetails"

afterEach(cleanup)

const BASE_IMPRESSUM: ImpressumDto = {
  name: "Freiwillige Feuerwehr Musterstadt",
  address: "Hauptstraße 1\n12345 Musterstadt",
  contactEmail: "kontakt@feuerwehr-musterstadt.de",
}

describe("ImpressumDetails", () => {
  it("renders the phone number when configured", () => {
    render(
      <ImpressumDetails
        impressum={{ ...BASE_IMPRESSUM, phone: "+49 123 456789" }}
      />,
    )

    expect(screen.queryByText("+49 123 456789")).not.toBeNull()
  })

  it("does not render a phone number when it is not configured", () => {
    render(<ImpressumDetails impressum={BASE_IMPRESSUM} />)

    expect(screen.queryByText("+49 123 456789")).toBeNull()
  })

  it("renders nothing when there is no impressum", () => {
    const { container } = render(<ImpressumDetails impressum={null} />)

    expect(container.textContent).toBe("")
  })
})
