import type { ReactNode } from "react"

import Footer from "#/components/Footer"
import Header from "#/components/Header"

interface DefaultLayoutProps {
  children: ReactNode
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <div className="flex h-dvh flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <Footer />
    </div>
  )
}
