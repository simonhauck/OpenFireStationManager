import { Card } from "@astryxdesign/core/Card"
import { Heading } from "@astryxdesign/core/Heading"
import { HStack } from "@astryxdesign/core/HStack"
import { Text } from "@astryxdesign/core/Text"
import { VStack } from "@astryxdesign/core/VStack"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Settings, ShieldCheck, Shirt, UserRound, Users } from "lucide-react"
import type React from "react"

import { meQuery } from "#/api/auth.queries"
import { hasRequiredRole } from "#/api/auth.utils"
import PageSection from "#/components/base/PageSection"
import type { UserRole } from "#/users/model/user.ts"

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
    title: "Mitglieder",
    description: "Personen der Feuerwehr verwalten.",
    href: "/members",
    icon: UserRound,
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

export default function Dashboard() {
  const { data } = useQuery(meQuery())

  const userRoles: UserRole[] = data?.user?.roles ?? []
  const userName = data?.user?.firstName ?? data?.user?.username ?? ""

  const visibleItems = DASHBOARD_ITEMS.filter((item) =>
    hasRequiredRole(userRoles, item.allowedRoles),
  )

  const title = userName ? `Willkommen, ${userName}` : "Willkommen"

  return (
    <PageSection title={title} subtitle="Wähle einen Bereich, um fortzufahren.">
      <div className="mb-6 flex justify-center">
        <Text size="2xl" weight="semibold">
          Was möchtest du tun?
        </Text>
      </div>
      <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="group block cursor-pointer no-underline"
          >
            <Card className="h-full transition-transform duration-200 group-hover:-translate-y-1">
              <HStack gap={4} vAlign="start">
                <item.icon
                  className="mt-1 size-8 shrink-0"
                  aria-hidden="true"
                />
                <VStack gap={1}>
                  <Heading level={3}>{item.title}</Heading>
                  <Text type="supporting">{item.description}</Text>
                </VStack>
              </HStack>
            </Card>
          </Link>
        ))}
      </div>
    </PageSection>
  )
}
