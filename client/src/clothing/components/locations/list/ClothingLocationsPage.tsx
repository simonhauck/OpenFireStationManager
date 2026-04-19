import ClothingLocationsTable from "#/clothing/components/locations/list/ClothingLocationsTable"
import { useClothingLocations } from "#/clothing/service/clothingLocationsQueries"
import AppBreadcrumb from "#/components/base/AppBreadcrumb"
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
      <div className="space-y-4">
        <AppBreadcrumb
          items={[
            { label: "Startseite", to: "/" },
            { label: "Klamotten Management", to: "/clothing-management" },
            { label: "Standorte" },
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>Klamottenmanagement</CardTitle>
            <CardDescription>Alle vorhandenen Standorte</CardDescription>
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
      </div>
    </RoleGuard>
  )
}
