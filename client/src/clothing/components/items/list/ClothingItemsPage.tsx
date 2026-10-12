import ClothingItemsTable from "#/clothing/components/items/list/ClothingItemsTable"
import { useClothingItems } from "#/clothing/service/clothingItemsQueries"
import CreateWithImportButton from "#/components/base/CreateWithImportButton"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard"

export default function ClothingItemsPage() {
  const { data: clothingItems, isLoading, isError } = useClothingItems()

  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <PageSection
        title="Kleidungsstücke"
        subtitle="Alle vorhandenen Kleidungsstücke"
        buttons={
          <CreateWithImportButton
            label="Neues Kleidungsstück"
            createTo="/clothing-management/items/new"
            importTo="/clothing-management/items/batch"
          />
        }
      >
        <RenderIf when={isLoading}>
          <LoadingIndicator label="Kleidungsstücke werden geladen..." />
        </RenderIf>

        <RenderIf when={isError}>
          <ErrorState message="Kleidungsstücke konnten nicht geladen werden." />
        </RenderIf>

        <RenderIf when={clothingItems !== undefined}>
          <ClothingItemsTable items={clothingItems ?? []} />
        </RenderIf>
      </PageSection>
    </RoleGuard>
  )
}
