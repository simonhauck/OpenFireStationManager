/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import NoAccessPage from "./NoAccessPage"

afterEach(cleanup)

describe("NoAccessPage", () => {
  it("shows the heading, the signed-in name and a logout button", () => {
    render(<NoAccessPage fullName="Max Mustermann" />)

    expect(screen.getByText("Kein Zugriff")).not.toBeNull()
    expect(screen.getByText(/Max Mustermann/)).not.toBeNull()
    expect(screen.getByText(/Administrator/)).not.toBeNull()
    expect(screen.getByRole("button", { name: "Abmelden" })).not.toBeNull()
  })
})
