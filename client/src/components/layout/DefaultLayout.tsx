import type { ReactNode } from "react"
import ErrorBoundary from "#/components/ErrorBoundary"
import Footer from "#/components/Footer"
import Header from "#/components/Header"
import Breadcrumb from "#/components/layout/Breadcrumb"

interface DefaultLayoutProps {
  children: ReactNode
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <Breadcrumb />
      <main className="flex-1">
        <ErrorBoundary>
          <div className="min-h-full w-full p-2">{children}</div>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
