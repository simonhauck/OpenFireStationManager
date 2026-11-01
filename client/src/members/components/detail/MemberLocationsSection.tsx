import { Table, type TableColumn } from "@astryxdesign/core/Table"
import { Text } from "@astryxdesign/core/Text"
import LocationName from "#/clothing/components/shared/LocationName"
import type { ClothingLocation } from "#/clothing/model/clothingLocations.ts"
import PageSubSection from "#/components/base/PageSubSection"
import RenderIf from "#/components/base/RenderIf"

interface MemberLocationsSectionProps {
  locations: ClothingLocation[]
}

export default function MemberLocationsSection({
  locations,
}: MemberLocationsSectionProps) {
  const columns: TableColumn<ClothingLocation>[] = [
    {
      key: "name",
      header: "Standort",
      renderCell: (location) => (
        <LocationName locationId={location.id} name={location.name} />
      ),
    },
    {
      key: "comment",
      header: "Kommentar",
      renderCell: (location) => location.comment || "-",
    },
  ]

  return (
    <PageSubSection
      title="Standorte"
      subtitle="Standorte, die diesem Mitglied zugewiesen sind"
    >
      <RenderIf when={locations.length === 0}>
        <Text type="supporting" as="p">
          Keine Standorte zugewiesen.
        </Text>
      </RenderIf>

      <RenderIf when={locations.length > 0}>
        <Table data={locations} columns={columns} idKey="id" />
      </RenderIf>
    </PageSubSection>
  )
}
