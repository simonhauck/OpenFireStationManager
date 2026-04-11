import { Link } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { useState } from "react"

import type {
  SortDirection,
  SortKey,
} from "#/clothing/components/ClothingItemsTable"
import ClothingItemsTable from "#/clothing/components/ClothingItemsTable"
import { useClothingItems } from "#/clothing/service/clothingItemsQueries"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
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
import { Input } from "#/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select"

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
  const [selectedTypeId, setSelectedTypeId] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("id")
  const [sortDir, setSortDir] = useState<SortDirection>("asc")

  const isLoading = isLoadingItems || isLoadingTypes
  const isError = isItemsError || isTypesError
  const canRenderTable =
    clothingItems !== undefined && clothingTypes !== undefined

  const typeNameById = new Map(
    (clothingTypes ?? []).map((type) => [String(type.id), type.name]),
  )

  const terms = searchTerm
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)

  const filteredItems = (clothingItems ?? [])
    .filter((item) => {
      if (selectedTypeId !== "" && String(item.typeId) !== selectedTypeId) {
        return false
      }
      if (terms.length === 0) return true
      const typeName = (
        typeNameById.get(String(item.typeId)) ?? ""
      ).toLowerCase()
      return terms.every(
        (term) =>
          String(item.id).includes(term) ||
          (item.barcode ?? "").toLowerCase().includes(term) ||
          item.size.toLowerCase().includes(term) ||
          typeName.includes(term),
      )
    })
    .sort((a, b) => {
      let aVal: string | number
      let bVal: string | number
      switch (sortKey) {
        case "id":
          aVal = Number(a.id)
          bVal = Number(b.id)
          break
        case "barcode":
          aVal = (a.barcode ?? "").toLowerCase()
          bVal = (b.barcode ?? "").toLowerCase()
          break
        case "type":
          aVal = (typeNameById.get(String(a.typeId)) ?? "").toLowerCase()
          bVal = (typeNameById.get(String(b.typeId)) ?? "").toLowerCase()
          break
        case "size":
          aVal = a.size.toLowerCase()
          bVal = b.size.toLowerCase()
          break
        case "createdAt":
          aVal = a.metaData.createdAt
          bVal = b.metaData.createdAt
          break
        default:
          sortKey satisfies never
          return 0
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1
      return 0
    })

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

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
              <Button asChild variant="outline">
                <Link to="/clothing-management/items/new">
                  <Plus className="size-4" />
                  Kleidungsstueck erstellen
                </Link>
              </Button>
              <Button asChild>
                <Link to="/clothing-management/items/batch">Massenimport</Link>
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
            <div className="flex flex-wrap gap-2">
              <Input
                className="min-w-48 flex-1"
                placeholder="Suche nach ID, Barcode, Typ oder Groesse (kommagetrennt)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <SelectTrigger className="w-48" aria-label="Nach Typ filtern">
                  <SelectValue placeholder="Alle Typen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle Typen</SelectItem>
                  {(clothingTypes ?? []).map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ClothingItemsTable
              items={filteredItems}
              types={clothingTypes!}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
          </RenderIf>
        </CardContent>
      </Card>
    </RoleGuard>
  )
}
