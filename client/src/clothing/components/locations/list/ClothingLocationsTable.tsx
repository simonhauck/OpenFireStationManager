import { Link } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil, Trash2 } from "lucide-react"

import DataTable from "#/components/base/DataTable"
import type { DataTableColumn } from "#/components/base/DataTable"
import type { ClothingLocation } from "#/clothing/service/clothingLocationsQueries"
import { deleteClothingLocationMutation } from "#/clothing/service/clothingLocationsQueries"
import DeleteDialogComponent from "#/components/base/DeleteDialogComponent"
import { Button } from "#/components/ui/button"

interface ClothingLocationsTableProps {
  locations: ClothingLocation[]
}

export default function ClothingLocationsTable({
  locations,
}: ClothingLocationsTableProps) {
  const queryClient = useQueryClient()
  const { mutate: deleteLocation } = useMutation(
    deleteClothingLocationMutation(queryClient),
  )

  const columns: DataTableColumn<ClothingLocation>[] = [
    {
      id: "id",
      header: "ID",
      getValue: (location: ClothingLocation) => location.id,
    },
    {
      id: "name",
      header: "Ort",
      getValue: (location: ClothingLocation) => location.name,
    },
    {
      id: "comment",
      header: "Kommentar",
      getValue: (location: ClothingLocation) => location.comment || "-",
    },
    {
      id: "visibleForKleiderwart",
      header: "Nur Kleiderwart",
      getValue: (location: ClothingLocation) =>
        location.onlyVisibleForKleiderwart ? "Ja" : "Nein",
    },
    {
      id: "dashboard",
      header: "Dashboard",
      getValue: (location: ClothingLocation) =>
        location.shouldBeShownOnDashboard ? "Ja" : "Nein",
    },
    {
      id: "createdAt",
      header: "Erstellt am",
      getValue: (location: ClothingLocation) =>
        new Date(location.metaData.createdAt),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={locations}
      showSearch={true}
      searchPlaceholder="Standorte suchen..."
      emptyMessage="Keine Standorte gefunden."
      actionColumn={({ row: location }) => (
        <div className="flex justify-end gap-1">
          <Button asChild size="icon" variant="outline">
            <Link
              to="/clothing-management/locations/$clothingLocationId/edit"
              params={{ clothingLocationId: String(location.id) }}
              aria-label={`Standort ${location.name} bearbeiten`}
              title="Bearbeiten"
            >
              <Pencil className="size-4" />
            </Link>
          </Button>

          <DeleteDialogComponent
            onDelete={() => deleteLocation(location.id)}
            headline="Standort loeschen"
            bodyText={`Moechten Sie den Standort "${location.name}" wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.`}
          >
            <Button
              size="icon"
              variant="outline"
              aria-label={`Standort ${location.name} loeschen`}
              title="Loeschen"
            >
              <Trash2 className="size-4" />
            </Button>
          </DeleteDialogComponent>
        </div>
      )}
    />
  )
}
