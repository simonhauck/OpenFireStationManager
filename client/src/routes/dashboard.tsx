import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute, redirect } from "@tanstack/react-router"
import { Settings, ShieldCheck, Shirt, Users } from "lucide-react"

import { meQuery } from "#/api/auth.queries"
import type { components } from "#/api/schema"
import PageSection from "#/components/base/PageSection"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(meQuery())
    if (!data.authenticated) {
      throw redirect({ to: "/" })
    }
  },
  component: Dashboard,
})

type UserRole = components["schemas"]["UserAccount"]["roles"][number]

type DashboardItem = {
  title: string
  description: string
  href: string
  icon: React.ElementType
  allowedRoles: UserRole[]
}

const DASHBOARD_ITEMS: DashboardItem[] = [
  {
    title: "Pool Klamotten",
    description: "Klamotten im Pool einsehen, ausgeben und zurückgeben.",
    href: "/pool-clothing",
    icon: Shirt,
    allowedRoles: ["USER"],
  },
  {
    title: "Klamotten Management",
    description: "Schutzkleidungstypen, Standorte und Bestände verwalten.",
    href: "/clothing-management",
    icon: ShieldCheck,
    allowedRoles: ["KLEIDERWART"],
  },
  {
    title: "Nutzer Management",
    description: "Feuerwehr-Konten anlegen, bearbeiten und Rollen vergeben.",
    href: "/user-management",
    icon: Users,
    allowedRoles: ["ADMIN"],
  },
  {
    title: "Admin Einstellungen",
    description: "Anwendungsweite Konfiguration und Datenschutzerklärung.",
    href: "/admin/settings",
    icon: Settings,
    allowedRoles: ["ADMIN"],
  },
]

function hasAccess(userRoles: UserRole[], allowedRoles: UserRole[]): boolean {
  if (userRoles.includes("ADMIN")) return true
  return allowedRoles.some((role) => userRoles.includes(role))
}

export default function Dashboard() {
  const { data } = useQuery(meQuery())

  const userRoles: UserRole[] = data?.user?.roles ?? []
  const userName = data?.user?.firstName ?? data?.user?.username ?? ""

  const visibleItems = DASHBOARD_ITEMS.filter((item) =>
    hasAccess(userRoles, item.allowedRoles),
  )

  const title = userName ? `Willkommen, ${userName}` : "Willkommen"

  return (
    <PageSection title={title} subtitle="Wähle einen Bereich, um fortzufahren.">
      <p className="mb-6 text-center text-2xl font-semibold tracking-tight">
        Was möchtest du tun?
      </p>
      <div className="grid max-w-3xl mx-auto gap-4 md:grid-cols-2">
        {visibleItems.map((item, index) => (
          <Link
            key={item.href}
            to={item.href}
            className="group block cursor-pointer no-underline"
          >
            <Card
              className="rise-in h-full border-(--line) bg-[linear-gradient(165deg,var(--surface-strong),var(--surface))] transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary group-hover:shadow-lg"
              style={{ animationDelay: `${index * 80 + 50}ms` }}
            >
              <CardHeader className="flex flex-row items-start gap-4">
                <item.icon className="mt-1 size-8 shrink-0 text-(--sea-ink-soft)" />
                <div className="flex flex-col gap-1">
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription className="leading-relaxed text-(--sea-ink-soft)">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </PageSection>
  )
}
