import type { ReactNode } from "react"

type RenderIfProps = {
  when: boolean
  children: ReactNode
}

export default function RenderIf({ when, children }: RenderIfProps) {
  if (!when) {
    return null
  }

  return <>{children}</>
}
