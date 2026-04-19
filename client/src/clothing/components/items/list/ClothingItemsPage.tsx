import ClothingItemsTable from "#/clothing/components/items/list/ClothingItemsTable"
import { useClothingItems } from "#/clothing/service/clothingItemsQueries"
import { useClothingLocations } from "#/clothing/service/clothingLocationsQueries"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
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
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Klamottenmanagement</CardTitle>
              <CardDescription>
                Alle vorhandenen Kleidungsstuecke
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <CreateWithImportButton
                label="Neues Kleidungsstueck"
                createTo="/clothing-management/items/new"
                importTo="/clothing-management/items/batch"
              />
            </div>
          </div>
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
              items={clothingItems ?? []}
              types={clothingTypes!}
              locations={clothingLocations!}
            />
          </RenderIf>
        </CardContent>
      </Card>
    </RoleGuard>
  )
}
