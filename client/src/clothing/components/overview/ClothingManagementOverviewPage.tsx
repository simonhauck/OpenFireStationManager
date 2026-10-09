import { Button } from "@astryxdesign/core/Button"

import ClothingTypeSizeSummaryCard from "#/clothing/components/overview/ClothingTypeSizeSummaryCard"
import { useClothingTypeSizeSummary } from "#/clothing/service/clothingOverviewQueries"
import PageSection from "#/components/base/PageSection"
import RoleGuard from "#/components/base/RoleGuard"

export default function ClothingManagementOverviewPage() {
  const { data: summary, isLoading, isError } = useClothingTypeSizeSummary()

  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <PageSection
        title="Klamotten Management"
        subtitle="Wähle einen Bereich aus, den du verwalten möchtest."
        buttons={
          <>
            <Button
              label="Kleidungsstücke"
              variant="secondary"
              href="/clothing-management/items"
            />
            <Button
              label="Kleidungstypen"
              variant="secondary"
              href="/clothing-management/types"
            />
            <Button
              label="Standorte"
              variant="secondary"
              href="/clothing-management/locations"
            />
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
