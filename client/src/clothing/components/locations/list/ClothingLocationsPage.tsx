import ClothingLocationsTable from "#/clothing/components/locations/list/ClothingLocationsTable"
import { useClothingLocations } from "#/clothing/service/clothingLocationsQueries"
import CreateWithImportButton from "#/components/base/CreateWithImportButton"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard"
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
              <CreateWithImportButton
                label="Neuen Standort"
                createTo="/clothing-management/locations/new"
                importTo="/clothing-management/locations/batch"
              />
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
