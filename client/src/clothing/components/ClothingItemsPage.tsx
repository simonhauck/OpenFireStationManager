import { Link } from "@tanstack/react-router"

import ClothingItemsTable from "#/clothing/components/ClothingItemsTable"
import { useClothingItems } from "#/clothing/service/clothingItemsQueries"
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
import { Button } from "#/components/ui/button"

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

  const isLoading = isLoadingItems || isLoadingTypes
  const isError = isItemsError || isTypesError
  const canRenderTable =
    clothingItems !== undefined && clothingTypes !== undefined

  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <main className="page-wrap px-4 py-12">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Klamottenmanagement</CardTitle>
                <CardDescription>
                  Alle vorhandenen Kleidungsstuecke
                </CardDescription>
              </div>
              <Button asChild>
                <Link to="/klamottenmanagement/items/batch">Massenimport</Link>
              </Button>
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
                items={clothingItems!}
                types={clothingTypes!}
              />
            </RenderIf>
          </CardContent>
        </Card>
      </main>
    </RoleGuard>
  )
}
