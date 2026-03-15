import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/about")({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 sm:p-8">
        <p className="island-kicker mb-2">Über das Projekt</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          OpenFireStationManager
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
          OpenFireStationManager ist eine browserbasierte Open-Source-Plattform
          zur Verwaltung von Feuerwehrstationen. Das Projekt bietet eine sichere
          Nutzerverwaltung, rollenbasierten Zugriff und eine erweiterbare
          Grundlage für Einsatzplanung und Berichtswesen.
        </p>
      </section>
    </main>
  )
}
