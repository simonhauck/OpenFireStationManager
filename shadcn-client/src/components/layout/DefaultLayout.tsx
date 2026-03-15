import type { ReactNode } from "react"

import Footer from "#/components/Footer"
import Header from "#/components/Header"

interface DefaultLayoutProps {
  children: ReactNode
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
