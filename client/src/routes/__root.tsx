import { Outlet, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"

import "../styles.css"
import DefaultLayout from "#/components/layout/DefaultLayout"

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <DefaultLayout>
      <Outlet />
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "TanStack Query",
            render: <ReactQueryDevtoolsPanel />,
          },
          {
            name: "TanStack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </DefaultLayout>
  )
}
