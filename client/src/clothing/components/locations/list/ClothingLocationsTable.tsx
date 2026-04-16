import DataTable from "#/components/base/DataTable"
import type { DataTableColumn } from "#/components/base/DataTable"
import type { ClothingLocation } from "#/clothing/service/clothingLocationsQueries"

interface ClothingLocationsTableProps {
  locations: ClothingLocation[]
}

export default function ClothingLocationsTable({
  locations,
}: ClothingLocationsTableProps) {
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
    />
  )
}
