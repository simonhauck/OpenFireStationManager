import { Link } from "@tanstack/react-router"

import ClothingTypeSizeSummaryCard from "#/clothing/components/overview/ClothingTypeSizeSummaryCard"
import { useClothingTypeSizeSummary } from "#/clothing/service/clothingItemsQueries"
import AppBreadcrumb from "#/components/base/AppBreadcrumb"
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
  to:
    | "/clothing-management/items"
    | "/clothing-management/types"
    | "/clothing-management/locations"
}

interface ClothingManagementSubNavigationProps {
  entries: ClothingManagementEntry[]
}

const overviewEntries: ClothingManagementEntry[] = [
  {
    title: "Kleidungsstuecke",
    description: "Platzhalteransicht fuer vorhandene Kleidungsstuecke.",
    to: "/clothing-management/items",
  },
  {
    title: "Kleidungstypen",
    description: "Verwalte alle verfügbaren Kleidungstypen.",
    to: "/clothing-management/types",
  },
  {
    title: "Standorte",
    description: "Zeigt alle vorhandenen Lagerorte fuer Bekleidung.",
    to: "/clothing-management/locations",
  },
]

export default function ClothingManagementOverviewPage() {
  const { data: summary, isLoading, isError } = useClothingTypeSizeSummary()

  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <div className="space-y-4">
        <AppBreadcrumb
          items={[
            { label: "Startseite", to: "/" },
            { label: "Klamotten Management" },
          ]}
        />
        <div className="space-y-6">
          <ClothingManagementSubNavigation entries={overviewEntries} />

          <ClothingTypeSizeSummaryCard
            summary={summary}
            isLoading={isLoading}
            isError={isError}
          />
        </div>
      </div>
    </RoleGuard>
  )
}

function ClothingManagementSubNavigation({
  entries,
}: ClothingManagementSubNavigationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Klamottenmanagement</CardTitle>
        <CardDescription>
          Waehle einen Bereich aus, den du verwalten moechtest.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-3">
          {entries.map((entry) => (
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
      </CardContent>
    </Card>
  )
}
