import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RoleGuard from "#/components/base/RoleGuard"
import ClothingTypesTable from "#/clothing/components/ClothingTypesTable"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
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

  return (
    <main className="page-wrap px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Klamottenmanagement</CardTitle>
          <CardDescription>Kleidungstypen</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading && (
            <LoadingIndicator label="Kleidungstypen werden geladen..." />
          )}

          {isError && (
            <ErrorState message="Kleidungstypen konnten nicht geladen werden." />
          )}

          {clothingTypes && <ClothingTypesTable types={clothingTypes} />}
        </CardContent>
      </Card>
    </main>
  )
}
