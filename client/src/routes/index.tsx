import { Badge } from "@astryxdesign/core/Badge"
import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { Heading } from "@astryxdesign/core/Heading"
import { Text } from "@astryxdesign/core/Text"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Building2, Flame, ShieldCheck, Users } from "lucide-react"

import { meQuery } from "#/api/auth.queries"

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(meQuery())
    if (data.authenticated) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: App,
})

function App() {
  const highlights = [
    {
      title: "Schutzkleidung Management",
      text: "Zentrale Verwaltung von Schutzkleidungstypen und -beständen.",
      icon: Building2,
    },
    {
      title: "Rollenbasierter Zugriff",
      text: "Admin- und Nutzerrollen schützen sensible Arbeitsbereiche.",
      icon: ShieldCheck,
    },
    {
      title: "Nutzerverwaltung",
      text: "Feuerwehr-Konten im Adminbereich anlegen und bearbeiten.",
      icon: Users,
    },
  ]

  return (
    <>
      <Card padding={6} className="relative overflow-hidden">
        <div className="flex flex-col items-start gap-4">
          <Badge label="Öffentliche Projektübersicht" variant="neutral" />
          <Heading level={1}>OpenFireStationManager</Heading>
          <Text type="large" as="p">
            OpenFireStationManager hilft Feuerwehrstationen dabei, Nutzer,
            Aufgaben und die tägliche Verwaltung sicher und zentral in einer
            browserbasierten Plattform zu koordinieren.
          </Text>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              label="Quellcode ansehen"
              variant="secondary"
              href="https://github.com/simonhauck/OpenFireStationManager"
              target="_blank"
              rel="noopener noreferrer"
            />
            <span className="inline-flex items-center gap-2 pl-1">
              <Flame className="size-4" aria-hidden="true" />
              <Text type="supporting">
                Für transparentes, praktisches Stationsmanagement.
              </Text>
            </span>
          </div>
        </div>
      </Card>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item.title}>
            <div className="flex flex-col gap-2">
              <Badge
                label="Funktion"
                variant="neutral"
                icon={<item.icon className="size-3.5" aria-hidden="true" />}
              />
              <Heading level={2}>{item.title}</Heading>
              <Text type="supporting">{item.text}</Text>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
