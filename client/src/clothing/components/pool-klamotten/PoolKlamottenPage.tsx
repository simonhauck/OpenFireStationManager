import { Badge } from "@astryxdesign/core/Badge"
import { Button } from "@astryxdesign/core/Button"
import { Text } from "@astryxdesign/core/Text"
import { Fragment } from "react"
import type {
  ClothingLocationSizeSummary,
  ClothingTypeSizeSummary,
} from "#/clothing/model/overview.ts"
import { useClothingOverview } from "#/clothing/service/clothingOverviewQueries"
import ErrorState from "#/components/base/ErrorState"
import LabelWithCount from "#/components/base/LabelWithCount"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import PageSubSection from "#/components/base/PageSubSection"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard.tsx"

export default function PoolKlamottenPage() {
  const { data: overview, isLoading, isError } = useClothingOverview()

  return (
    <PageSection
      title="Pool Klamotten"
      buttonPosition="right"
      className="tablet-controls"
      buttons={
        <>
          <RoleGuard allowedRoles={["KLEIDERWART"]} hideChildComponent={true}>
            <Button
              label="Inventarisierung starten"
              variant="secondary"
              size="lg"
              href="/pool-clothing/inventory-reconciliation"
            />
          </RoleGuard>
          <RoleGuard allowedRoles={["KLEIDERWART"]} hideChildComponent={true}>
            <Button
              label="Umlagerung starten"
              variant="secondary"
              size="lg"
              href="/pool-clothing/relocation"
            />
          </RoleGuard>
          <Button
            label="Klamotten tauschen"
            variant="primary"
            size="lg"
            href="/pool-clothing/checkout"
          />
          <Button
            label="Klamotten tauschen (klassisch)"
            variant="secondary"
            size="lg"
            href="/pool-clothing/checkout-classic"
          />
          <Button
            label="Klamotten in die Wäsche geben"
            variant="secondary"
            size="lg"
            href="/pool-clothing/return?returnTarget=WAESCHE"
          />
          <Button
            label="Klamotten zurück in den Pool geben"
            variant="secondary"
            size="lg"
            href="/pool-clothing/return?returnTarget=POOL"
          />
        </>
      }
    >
      <PoolKlamottenOverviewCard
        overview={overview}
        isLoading={isLoading}
        isError={isError}
      />
    </PageSection>
  )
}

interface PoolKlamottenOverviewCardProps {
  overview: ClothingLocationSizeSummary[] | undefined
  isLoading: boolean
  isError: boolean
}

function PoolKlamottenOverviewCard({
  overview,
  isLoading,
  isError,
}: PoolKlamottenOverviewCardProps) {
  const overviewData = overview ?? []

  return (
    <section className="space-y-6">
      <RenderIf when={isLoading}>
        <LoadingIndicator label="Uebersicht wird geladen..." />
      </RenderIf>

      <RenderIf when={isError}>
        <ErrorState message="Uebersicht konnte nicht geladen werden." />
      </RenderIf>

      <RenderIf when={!isLoading && !isError && overviewData.length === 0}>
        <Text type="supporting" as="p">
          Es sind keine Standorte fuer die Anzeige konfiguriert.
        </Text>
      </RenderIf>

      <RenderIf when={overviewData.length > 0}>
        <div>
          {overviewData.map((locationSummary) => (
            <LocationSizeSummaryTable
              key={locationSummary.locationId}
              summary={locationSummary}
            />
          ))}
        </div>
      </RenderIf>
    </section>
  )
}

interface LocationSizeSummaryTableProps {
  summary: ClothingLocationSizeSummary
}

function LocationSizeSummaryTable({ summary }: LocationSizeSummaryTableProps) {
  const typeSummaries = [...summary.types].sort((a, b) =>
    a.typeName.localeCompare(b.typeName, "de"),
  )

  const totalCount = typeSummaries.reduce(
    (locationTotal, typeSummary) => locationTotal + typeSummary.totalCount,
    0,
  )

  return (
    <PageSubSection
      title={summary.locationName}
      subtitle="Verfügbare Pool-Kleidung am Standort"
      right={
        <div className="text-right">
          <Text as="p" type="supporting" className="uppercase tracking-wide">
            Gesamt
          </Text>
          <Text as="p" size="2xl" weight="bold" className="text-success">
            {totalCount}
          </Text>
        </div>
      }
    >
      <RenderIf when={typeSummaries.length > 0}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {typeSummaries.map((typeSummary) => (
            <TypeAvailabilityPanel
              key={`${summary.locationId}-${typeSummary.typeId}`}
              locationId={summary.locationId}
              typeSummary={typeSummary}
            />
          ))}
        </div>
      </RenderIf>

      <RenderIf when={typeSummaries.length === 0}>
        <Text type="supporting" as="p">
          Keine Kleidungstypen vorhanden.
        </Text>
      </RenderIf>
    </PageSubSection>
  )
}

interface TypeAvailabilityPanelProps {
  locationId: ClothingLocationSizeSummary["locationId"]
  typeSummary: ClothingTypeSizeSummary
}

function TypeAvailabilityPanel({
  locationId,
  typeSummary,
}: TypeAvailabilityPanelProps) {
  const sizeGroups = [...typeSummary.sizeGroupSummary].map(
    (sizeGroupSummary) => ({
      ...sizeGroupSummary,
      sizes: [...sizeGroupSummary.sizes].sort((a, b) =>
        a.size.localeCompare(b.size, "de"),
      ),
    }),
  )

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="bg-muted/40 border-b px-3 py-2">
        <Text as="p" weight="semibold" style={{ fontSize: 16 }}>
          <LabelWithCount
            label={typeSummary.typeName}
            count={typeSummary.totalCount}
            format="braces"
          />
        </Text>
      </div>

      <div className="p-3">
        <RenderIf
          when={sizeGroups.some((sizeGroup) => sizeGroup.sizes.length > 0)}
        >
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
            {sizeGroups.map((sizeGroupSummary) => (
              <Fragment
                key={`${locationId}-${typeSummary.typeId}-${sizeGroupSummary.name}`}
              >
                <Text
                  as="span"
                  type="supporting"
                  className="uppercase tracking-wide"
                >
                  {sizeGroupSummary.name}
                </Text>
                <div className="flex flex-wrap gap-1">
                  {sizeGroupSummary.sizes.map((sizeSummary) => (
                    <Badge
                      key={`${locationId}-${typeSummary.typeId}-${sizeGroupSummary.name}-${sizeSummary.size}`}
                      variant="neutral"
                      className="size-chip"
                      label={
                        <LabelWithCount
                          label={sizeSummary.size}
                          count={sizeSummary.count}
                          format="colon"
                        />
                      }
                    />
                  ))}
                </div>
              </Fragment>
            ))}
          </div>
        </RenderIf>

        <RenderIf
          when={!sizeGroups.some((sizeGroup) => sizeGroup.sizes.length > 0)}
        >
          <Text type="supporting" as="span">
            Keine Kleidungsstuecke vorhanden.
          </Text>
        </RenderIf>
      </div>
    </div>
  )
}
