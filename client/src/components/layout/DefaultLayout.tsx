import type { ReactNode } from "react"

import Footer from "#/components/Footer"
import Header from "#/components/Header"
import ErrorBoundary from "#/components/ErrorBoundary"
import Breadcrumb from "#/components/layout/Breadcrumb"
import KioskKeyboard from "#/components/kiosk/KioskKeyboard"

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
      <KioskKeyboard />
      <Footer />
    </div>
  )
}
