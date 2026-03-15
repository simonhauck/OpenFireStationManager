import { Link, createFileRoute } from "@tanstack/react-router"
import { Flame, ShieldCheck, Users, Building2 } from "lucide-react"

import { Badge } from "#/components/ui/badge"
import { Button } from "#/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"

export const Route = createFileRoute("/")({ component: App })

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
    <main className="page-wrap px-4 pb-12 pt-14 sm:pt-16">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <Badge variant="secondary" className="mb-4 uppercase tracking-wider">
          Öffentliche Projektübersicht
        </Badge>
        <h1 className="display-title mb-4 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          OpenFireStationManager
        </h1>
        <p className="mb-8 max-w-2xl text-base leading-relaxed text-[var(--sea-ink-soft)] sm:text-lg">
          OpenFireStationManager hilft Feuerwehrstationen dabei, Nutzer,
          Aufgaben und die tägliche Verwaltung sicher und zentral in einer
          browserbasierten Plattform zu koordinieren.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link to="/about">Mehr erfahren</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a
              href="https://github.com/simonhauck/OpenFireStationManager"
              target="_blank"
              rel="noopener noreferrer"
            >
              Quellcode ansehen
            </a>
          </Button>
          <span className="inline-flex items-center gap-2 pl-1 text-sm text-[var(--sea-ink-soft)]">
            <Flame className="size-4 text-(--palm)" />
            Für transparentes, praktisches Stationsmanagement.
          </span>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {highlights.map((item, index) => (
          <Card
            key={item.title}
            className="rise-in border-(--line) bg-[linear-gradient(165deg,var(--surface-strong),var(--surface))]"
            style={{ animationDelay: `${index * 110 + 70}ms` }}
          >
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                <item.icon className="size-3.5" />
                Funktion
              </Badge>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription className="leading-relaxed text-(--sea-ink-soft)">
                {item.text}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  )
}
