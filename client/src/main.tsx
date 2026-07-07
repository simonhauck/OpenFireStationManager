import ReactDOM from "react-dom/client"
import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { Toaster } from "sonner"
import { getRouter } from "./router"
import KioskProvider from "#/components/kiosk/KioskProvider"

const { router, queryClient } = getRouter()

const rootElement = document.getElementById("app")!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <KioskProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </KioskProvider>
    </QueryClientProvider>,
  )
}
