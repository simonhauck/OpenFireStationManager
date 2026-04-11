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
import { Input } from "#/components/ui/input"
import { Link } from "@tanstack/react-router"
import { useState } from "react"

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

  const [searchTerm, setSearchTerm] = useState("")

  const isLoading = isLoadingItems || isLoadingTypes
  const isError = isItemsError || isTypesError
  const canRenderTable =
    clothingItems !== undefined && clothingTypes !== undefined

  const filteredItems =
    clothingItems?.filter((item) => {
      const term = searchTerm.trim().toLowerCase()
      if (term === "") return true
      return (
        String(item.id).toLowerCase().includes(term) ||
        (item.barcode ?? "").toLowerCase().includes(term) ||
        item.size.toLowerCase().includes(term)
      )
    }) ?? []

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
            <Button asChild>
              <Link to="/clothing-management/items/batch">Massenimport</Link>
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
            <Input
              placeholder="Suche nach ID, Barcode oder Groesse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ClothingItemsTable items={filteredItems} types={clothingTypes!} />
          </RenderIf>
        </CardContent>
      </Card>
    </RoleGuard>
  )
}
