import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { QueryClient } from "@tanstack/react-query"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const queryClient = new QueryClient()

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultStaleTime: 10 * 60 * 1000, // 10 minutes
    context: { queryClient },
  })

  return { router, queryClient }
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>["router"]
  }
}
