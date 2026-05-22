import ClothingLocationsTable from "#/clothing/components/locations/list/ClothingLocationsTable"
import { useClothingLocations } from "#/clothing/service/clothingLocationsQueries"
import CreateWithImportButton from "#/components/base/CreateWithImportButton"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard"

export default function ClothingLocationsPage() {
  const { data: locations, isLoading, isError } = useClothingLocations()
  const canRenderTable = locations !== undefined

  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <PageSection
        title="Standorte"
        subtitle="Alle vorhandenen Standorte"
        buttons={
          <CreateWithImportButton
            label="Neuen Standort"
            createTo="/clothing-management/locations/new"
            importTo="/clothing-management/locations/batch"
          />
        }
      >
        <RenderIf when={isLoading}>
          <LoadingIndicator label="Standorte werden geladen..." />
        </RenderIf>

        <RenderIf when={isError}>
          <ErrorState message="Standorte konnten nicht geladen werden." />
        </RenderIf>

        <RenderIf when={canRenderTable}>
          <ClothingLocationsTable locations={locations!} />
        </RenderIf>
      </PageSection>
    </RoleGuard>
  )
}
