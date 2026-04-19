import { Fragment } from "react"
import { Link } from "@tanstack/react-router"
import type { RegisteredRouter, RoutePaths } from "@tanstack/react-router"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "#/components/ui/breadcrumb"
import RenderIf from "#/components/base/RenderIf"

export interface BreadcrumbEntry {
  label: string
  to?: RoutePaths<RegisteredRouter["routeTree"]>
}

interface AppBreadcrumbProps {
  items: BreadcrumbEntry[]
}

export default function AppBreadcrumb({ items }: AppBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <Fragment key={item.label}>
              <BreadcrumbItem>
                <RenderIf when={!isLast && item.to !== undefined}>
                  <BreadcrumbLink asChild>
                    <Link to={item.to!}>{item.label}</Link>
                  </BreadcrumbLink>
                </RenderIf>
                <RenderIf when={isLast || item.to === undefined}>
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                </RenderIf>
              </BreadcrumbItem>
              <RenderIf when={!isLast}>
                <BreadcrumbSeparator />
              </RenderIf>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
