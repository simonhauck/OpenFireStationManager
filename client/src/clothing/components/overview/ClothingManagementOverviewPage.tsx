import { Link } from "@tanstack/react-router"

import ClothingTypeSizeSummaryCard from "#/clothing/components/overview/ClothingTypeSizeSummaryCard"
import { useClothingTypeSizeSummary } from "#/clothing/service/clothingOverviewQueries"
import PageSection from "#/components/base/PageSection"
import RoleGuard from "#/components/base/RoleGuard"
import { Button } from "#/components/ui/button"

export default function ClothingManagementOverviewPage() {
  const { data: summary, isLoading, isError } = useClothingTypeSizeSummary()

  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <PageSection
        title="Klamotten Management"
        subtitle="Wähle einen Bereich aus, den du verwalten möchtest."
        buttons={
          <>
            <Button asChild variant="outline">
              <Link to="/clothing-management/items">Kleidungsstücke</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/clothing-management/types">Kleidungstypen</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/clothing-management/locations">Standorte</Link>
            </Button>
          </>
        }
      >
        <ClothingTypeSizeSummaryCard
          summary={summary}
          isLoading={isLoading}
          isError={isError}
        />
      </PageSection>
    </RoleGuard>
  )
}
