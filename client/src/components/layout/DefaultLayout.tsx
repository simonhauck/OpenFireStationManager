import { AppShell } from "@astryxdesign/core/AppShell"
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
    <AppShell
      variant="wash"
      contentPadding={0}
      topNav={<Header />}
      mobileNav={{ hasToggle: false }}
    >
      <div className="flex min-h-[calc(100dvh-3rem)] flex-col">
        <Breadcrumb />
        <div className="flex-1 p-2">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
        <Footer />
      </div>
    </AppShell>
  )
}
