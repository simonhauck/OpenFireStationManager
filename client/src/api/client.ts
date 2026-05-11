import createClient from "openapi-fetch"
import type { paths } from "#/api/schema"

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ""

export const client = createClient<paths>({
  baseUrl,
  credentials: "include",
})

/**
 * Global middleware: throws an Error for every non-2xx response.
 *
 * Reads the `detail` field from the response body when the server returns a
 * ProblemDetail (Spring's standard error shape). Falls back to a generic
 * message that includes the HTTP status code when the body cannot be parsed
 * or carries no `detail`.
 */
client.use({
  async onResponse({ response }) {
    if (response.ok) return

    let detail: string | undefined
    try {
      const body = await response.clone().json()
      if (
        typeof body === "object" &&
        body !== null &&
        typeof body.detail === "string"
      ) {
        detail = body.detail
      }
    } catch {
      // body is not JSON — fall through to the status-based message
    }

    throw new Error(detail ?? `Request failed with status ${response.status}`)
  },
})
