import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toolbar } from "../layout/Toolbar";
import PWABadge from "../PWABadge";

const RootLayout = () => (
  <>
    <Toolbar />
    <Outlet />
    <PWABadge />
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRoute({
  component: RootLayout,
});
