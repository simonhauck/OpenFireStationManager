import { BreadcrumbItem, Breadcrumbs } from "@astryxdesign/core/Breadcrumbs"
import { VisuallyHidden } from "@astryxdesign/core/VisuallyHidden"
import { useLocation, useRouter } from "@tanstack/react-router"
import { ChevronRight, Home } from "lucide-react"
import { buildCrumbs } from "#/components/layout/breadcrumbModel"

export default function Breadcrumb() {
  const router = useRouter()
  const { pathname } = useLocation()

  const routePatterns = Object.values(router.routesById)
    .map((route) => route.fullPath)
    .filter((p): p is string => typeof p === "string" && p.length > 0)

  const crumbs = buildCrumbs(pathname, routePatterns)

  if (crumbs.length === 0) return null

  return (
    <Breadcrumbs
      label="Breadcrumb"
      variant="supporting"
      separator={<ChevronRight className="size-3.5" aria-hidden="true" />}
      className="border-border bg-background hidden border-b px-4 pt-1 pb-2 sm:block"
    >
      <BreadcrumbItem
        href="/"
        startIcon={<Home className="size-3.5" aria-hidden="true" />}
      >
        <VisuallyHidden>Startseite</VisuallyHidden>
      </BreadcrumbItem>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1

        if (isLast || !crumb.isLinked) {
          return (
            <BreadcrumbItem key={crumb.href} isCurrent={isLast}>
              {crumb.label}
            </BreadcrumbItem>
          )
        }

        return (
          <BreadcrumbItem key={crumb.href} href={crumb.href}>
            {crumb.label}
          </BreadcrumbItem>
        )
      })}
    </Breadcrumbs>
  )
}
