import type { QueryClient } from "@tanstack/react-query"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { fetchFreshSession } from "#/api/auth.queries"
import { loginUrl } from "#/api/auth.utils"

/**
 * Leaves the app for the login entry point, which returns to `redirect` after signing in. While
 * the provider session is still valid this happens without a password prompt.
 *
 * `replace` keeps the guarded page out of the history, so going back does not loop through the
 * login again. The returned promise never settles: nothing may render or start work while the
 * browser navigates away.
 */
export function redirectToLogin(redirect: string): Promise<never> {
  window.location.replace(loginUrl(redirect))
  return new Promise<never>(() => {
    // Intentionally never settles; the page is being replaced.
  })
}

interface SessionCheckContext {
  context: { queryClient: QueryClient }
  location: { href: string }
  preload: boolean
}

/**
 * `beforeLoad` for routes that start a workflow (the wizards): re-checks the session with the
 * server instead of trusting the cached `/me` answer, and signs in again before anything starts
 * when the session has expired.
 */
export async function requireFreshSession({
  context,
  location,
  preload,
}: SessionCheckContext): Promise<void> {
  if (preload) return
  const session = await fetchFreshSession(context.queryClient)
  if (!session.authenticated) {
    await redirectToLogin(location.href)
  }
}

/**
 * Re-checks the session whenever the tab becomes visible again, e.g. when a station tablet wakes
 * up, and signs in again when it has expired in the meantime.
 */
export function useSessionRecheckOnVisible(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    async function recheck() {
      if (document.visibilityState !== "visible") return
      try {
        const session = await fetchFreshSession(queryClient)
        if (!session.authenticated) {
          const { pathname, search, hash } = window.location
          await redirectToLogin(`${pathname}${search}${hash}`)
        }
      } catch {
        // Offline or server unreachable: keep the page; the next request reports the error.
      }
    }

    const onVisibilityChange = () => void recheck()
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange)
  }, [queryClient])
}
