import { Link } from "@tanstack/react-router"
import type { ClothingLocation } from "#/clothing/model/clothingLocations.ts"
import type { DataTableColumn } from "#/components/base/DataTable"
import DataTable from "#/components/base/DataTable"
import PageSubSection from "#/components/base/PageSubSection"

interface MemberLocationsSectionProps {
  locations: ClothingLocation[]
}

export default function MemberLocationsSection({
  locations,
}: MemberLocationsSectionProps) {
  const columns: DataTableColumn<ClothingLocation>[] = [
    {
      id: "name",
      header: "Standort",
      renderCell: (location: ClothingLocation) => (
        <Link
          to="/clothing-management/locations/$clothingLocationId/edit"
          params={{ clothingLocationId: String(location.id) }}
          className="hover:underline"
        >
          {location.name}
        </Link>
      ),
      getValue: (location: ClothingLocation) => location.name,
    },
    {
      id: "comment",
      header: "Kommentar",
      getValue: (location: ClothingLocation) => location.comment || "-",
    },
  ]

  return (
    <PageSubSection
      title="Standorte"
      subtitle="Standorte, die diesem Mitglied zugewiesen sind"
    >
      <DataTable
        columns={columns}
        rows={locations}
        showSearch={false}
        emptyMessage="Keine Standorte zugewiesen."
      />
    </PageSubSection>
  )
}
