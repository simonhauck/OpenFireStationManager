import { Link } from "@tanstack/react-router"

import ClothingLocationsTable from "#/clothing/components/locations/list/ClothingLocationsTable"
import { useClothingLocations } from "#/clothing/service/clothingLocationsQueries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard"
import { Button } from "#/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"

export default function ClothingLocationsPage() {
  const { data: locations, isLoading, isError } = useClothingLocations()
  const canRenderTable = locations !== undefined

  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Klamottenmanagement</CardTitle>
              <CardDescription>Alle vorhandenen Standorte</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/clothing-management/locations/new">
                  Standort erstellen
                </Link>
              </Button>
              <Button asChild>
                <Link to="/clothing-management/locations/batch">
                  Massenimport
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <RenderIf when={isLoading}>
            <LoadingIndicator label="Standorte werden geladen..." />
          </RenderIf>

          <RenderIf when={isError}>
            <ErrorState message="Standorte konnten nicht geladen werden." />
          </RenderIf>

          <RenderIf when={canRenderTable}>
            <ClothingLocationsTable locations={locations!} />
          </RenderIf>
        </CardContent>
      </Card>
    </RoleGuard>
  )
}
