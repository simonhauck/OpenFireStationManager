import ClothingItemsTable from "#/clothing/components/ClothingItemsTable"
import { useClothingItems } from "#/clothing/service/clothingItemsQueries"
import { useClothingLocations } from "#/clothing/service/clothingLocationsQueries"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
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

export default function ClothingItemsPage() {
  const {
    data: clothingItems,
    isLoading: isLoadingItems,
    isError: isItemsError,
  } = useClothingItems()
  const {
    data: clothingTypes,
    isLoading: isLoadingTypes,
    isError: isTypesError,
  } = useClothingTypes()
  const {
    data: clothingLocations,
    isLoading: isLoadingLocations,
    isError: isLocationsError,
  } = useClothingLocations()

  const isLoading = isLoadingItems || isLoadingTypes || isLoadingLocations
  const isError = isItemsError || isTypesError || isLocationsError
  const canRenderTable =
    clothingItems !== undefined &&
    clothingTypes !== undefined &&
    clothingLocations !== undefined

  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <main className="page-wrap px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Klamottenmanagement</CardTitle>
            <CardDescription>Alle vorhandenen Kleidungsstuecke</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <RenderIf when={isLoading}>
              <LoadingIndicator label="Kleidungsstuecke werden geladen..." />
            </RenderIf>

            <RenderIf when={isError}>
              <ErrorState message="Kleidungsstuecke konnten nicht geladen werden." />
            </RenderIf>

            <RenderIf when={canRenderTable}>
              <ClothingItemsTable
                items={clothingItems!}
                types={clothingTypes!}
                locations={clothingLocations!}
              />
            </RenderIf>
          </CardContent>
        </Card>
      </main>
    </RoleGuard>
  )
}
