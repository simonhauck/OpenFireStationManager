import { Link } from "@tanstack/react-router"
import { Plus } from "lucide-react"

import ClothingItemsTable from "#/clothing/components/items/list/ClothingItemsTable"
import { useClothingItems } from "#/clothing/service/clothingItemsQueries"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
import AppBreadcrumb from "#/components/base/AppBreadcrumb"
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
      <div className="space-y-4">
        <AppBreadcrumb
          items={[
            { label: "Startseite", to: "/" },
            { label: "Klamotten Management", to: "/clothing-management" },
            { label: "Kleidungsstücke" },
          ]}
        />
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
                <Button asChild variant="outline">
                  <Link to="/clothing-management/items/new">
                    <Plus className="size-4" />
                    Kleidungsstueck erstellen
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/clothing-management/items/batch">
                    Massenimport
                  </Link>
                </Button>
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
              />
            </RenderIf>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
