import type { ReactNode } from "react"

import Footer from "#/components/Footer"
import Header from "#/components/Header"
import ErrorBoundary from "#/components/ErrorBoundary"

interface DefaultLayoutProps {
  children: ReactNode
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <div className="flex h-dvh flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <ErrorBoundary>
          <div className="min-h-full w-full p-2">{children}</div>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
