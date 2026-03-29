import { Link } from "@tanstack/react-router"

import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard"
import ClothingTypesTable from "#/clothing/components/ClothingTypesTable"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
import { Button } from "#/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"

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
    <main className="page-wrap px-4 py-12">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Klamottenmanagement</CardTitle>
              <CardDescription>Kleidungstypen</CardDescription>
            </div>
            <Button asChild>
              <Link to="/klamottenmanagement/types/new">
                Kleidungstyp erstellen
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <RenderIf when={isLoading}>
            <LoadingIndicator label="Kleidungstypen werden geladen..." />
          </RenderIf>

          <RenderIf when={isError}>
            <ErrorState message="Kleidungstypen konnten nicht geladen werden." />
          </RenderIf>

          <RenderIf when={canRenderTable}>
            <ClothingTypesTable types={clothingTypes!} />
          </RenderIf>
        </CardContent>
      </Card>
    </main>
  )
}
