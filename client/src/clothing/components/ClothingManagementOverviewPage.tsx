import { Link } from "@tanstack/react-router"

import RoleGuard from "#/components/base/RoleGuard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"

interface ClothingManagementEntry {
  title: string
  description: string
  to: "/klamottenmanagement/items" | "/klamottenmanagement/types"
}

const overviewEntries: ClothingManagementEntry[] = [
  {
    title: "Kleidungsstuecke",
    description: "Platzhalteransicht fuer vorhandene Kleidungsstuecke.",
    to: "/klamottenmanagement/items",
  },
  {
    title: "Kleidungstypen",
    description: "Verwalte alle verfügbaren Kleidungstypen.",
    to: "/klamottenmanagement/types",
  },
]

export default function ClothingManagementOverviewPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <main className="page-wrap px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Klamottenmanagement</CardTitle>
            <CardDescription>
              Waehle einen Bereich aus, den du verwalten moechtest.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {overviewEntries.map((entry) => (
                <Link
                  key={entry.to}
                  to={entry.to}
                  className="focus-visible:ring-ring block min-w-64 flex-1 rounded-lg border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2"
                >
                  <p className="font-medium">{entry.title}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {entry.description}
                  </p>
                </Link>
              ))}
            </div>

            <div id="klamottenmanagement-content" />
          </CardContent>
        </Card>
      </main>
    </RoleGuard>
  )
}

