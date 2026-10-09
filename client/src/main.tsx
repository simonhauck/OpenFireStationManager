import { LayerProvider } from "@astryxdesign/core/Layer"
import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import ReactDOM from "react-dom/client"
import { getRouter } from "./router"
import { AppThemeProvider } from "./theme/AppThemeProvider"

const { router, queryClient } = getRouter()

const rootElement = document.getElementById("app")

if (!rootElement) {
  throw new Error('Root element "app" was not found')
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <LayerProvider>
          <RouterProvider router={router} />
        </LayerProvider>
      </AppThemeProvider>
    </QueryClientProvider>,
  )
}
