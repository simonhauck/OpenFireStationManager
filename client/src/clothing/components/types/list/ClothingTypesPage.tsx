import { Link } from "@tanstack/react-router"

import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard"
import ClothingTypesTable from "#/clothing/components/types/list/ClothingTypesTable"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
import { Button } from "#/components/ui/button"

export default function ClothingTypesPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <ClothingTypesPageContent />
    </RoleGuard>
  )
}

function ClothingTypesPageContent() {
  const { data: clothingTypes, isLoading, isError } = useClothingTypes()
  const canRenderTable = clothingTypes !== undefined

  return (
    <PageSection
      title="Kleidungstypen"
      subtitle="Alle vorhandenen Kleidungstypen"
      buttons={
        <Button asChild>
          <Link to="/clothing-management/types/new">Kleidungstyp erstellen</Link>
        </Button>
      }
    >
      <RenderIf when={isLoading}>
        <LoadingIndicator label="Kleidungstypen werden geladen..." />
      </RenderIf>

      <RenderIf when={isError}>
        <ErrorState message="Kleidungstypen konnten nicht geladen werden." />
      </RenderIf>

      <RenderIf when={canRenderTable}>
        <ClothingTypesTable types={clothingTypes!} />
      </RenderIf>
    </PageSection>
  )
}
