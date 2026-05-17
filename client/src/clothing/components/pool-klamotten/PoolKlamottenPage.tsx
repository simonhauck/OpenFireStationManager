import { Link } from "@tanstack/react-router"

import type {
  ClothingLocationSizeSummary,
  ClothingTypeSizeSummary,
  SizeGroupSummary,
} from "#/clothing/service/clothingOverviewQueries"
import { useClothingOverview } from "#/clothing/service/clothingOverviewQueries"
import { TouchButton } from "#/clothing/checkout/components/TouchComponents"
import ErrorState from "#/components/base/ErrorState"
import LabelWithCount from "#/components/base/LabelWithCount"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RenderIf from "#/components/base/RenderIf"
import { Badge } from "#/components/ui/badge"
import { Card, CardContent, CardHeader } from "#/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table"
import RoleGuard from "#/components/base/RoleGuard.tsx"

export default function PoolKlamottenPage() {
  const { data: overview, isLoading, isError } = useClothingOverview()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-3">
        <RoleGuard allowedRoles={["KLEIDERWART"]} hideChildComponent={true}>
          <TouchButton asChild variant="outline">
            <Link to="/pool-clothing/relocation">Umlagerung starten</Link>
          </TouchButton>
        </RoleGuard>

        <TouchButton asChild>
          <Link to="/pool-clothing/checkout">Klamotten Ausgabe</Link>
        </TouchButton>
      </div>
      <PoolKlamottenOverviewCard
        overview={overview}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
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
    <section className="space-y-8">
      <RenderIf when={isLoading}>
        <LoadingIndicator label="Uebersicht wird geladen..." />
      </RenderIf>

      <RenderIf when={isError}>
        <ErrorState message="Uebersicht konnte nicht geladen werden." />
      </RenderIf>

      <RenderIf when={!isLoading && !isError && overviewData.length === 0}>
        <p className="text-muted-foreground text-sm">
          Es sind keine Standorte fuer die Anzeige konfiguriert.
        </p>
      </RenderIf>

      <RenderIf when={overviewData.length > 0}>
        {overviewData.map((locationSummary) => (
          <LocationSizeSummaryTable
            key={locationSummary.locationId}
            summary={locationSummary}
          />
        ))}
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {summary.locationName}
            </h2>
            <p className="text-muted-foreground text-sm">
              Verfuegbare Pool-Kleidung am Standort
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              Gesamt
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 text-3xl font-bold">
              {totalCount}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <RenderIf when={typeSummaries.length > 0}>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Kleidungstyp</TableHead>
                  <TableHead>Verfuegbarkeit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {typeSummaries.flatMap((typeSummary) =>
                  renderLocationTypeSummary(summary.locationId, typeSummary),
                )}
              </TableBody>
            </Table>
          </div>
        </RenderIf>

        <RenderIf when={typeSummaries.length === 0}>
          <p className="text-muted-foreground text-sm">
            Keine Kleidungstypen vorhanden.
          </p>
        </RenderIf>
      </CardContent>
    </Card>
  )
}

interface RenderableSizeGroupSummary {
  name: string
  totalCount: number
  sizes: SizeGroupSummary["sizes"]
}

function renderLocationTypeSummary(
  locationId: ClothingLocationSizeSummary["locationId"],
  typeSummary: ClothingTypeSizeSummary,
) {
  const sizeGroupSummaries: RenderableSizeGroupSummary[] =
    typeSummary.sizeGroupSummary.length > 0
      ? typeSummary.sizeGroupSummary
      : [{ name: "-", totalCount: 0, sizes: [] }]

  return sizeGroupSummaries.map((sizeGroupSummary, index) => {
    const sortedSizes = [...sizeGroupSummary.sizes].sort((a, b) =>
      a.size.localeCompare(b.size, "de"),
    )

    return (
      <TableRow
        key={`${locationId}-${typeSummary.typeId}-${sizeGroupSummary.name}-${index}`}
      >
        <RenderIf when={index === 0}>
          <TableCell
            rowSpan={sizeGroupSummaries.length}
            className="text-sm font-medium"
          >
            <LabelWithCount
              label={typeSummary.typeName}
              count={typeSummary.totalCount}
              format="braces"
            />
          </TableCell>
        </RenderIf>

        <TableCell>
          <RenderIf when={sortedSizes.length > 0}>
            <div className="flex flex-wrap gap-1">
              {sortedSizes.map((sizeSummary) => (
                <Badge
                  key={sizeSummary.size}
                  variant="outline"
                  className="gap-2 px-3 py-1.5 text-base"
                >
                  <LabelWithCount
                    label={sizeSummary.size}
                    count={sizeSummary.count}
                    format="colon"
                  />
                </Badge>
              ))}
            </div>
          </RenderIf>

          <RenderIf when={sortedSizes.length === 0}>
            <span className="text-muted-foreground text-sm">
              Keine Kleidungsstuecke vorhanden.
            </span>
          </RenderIf>
        </TableCell>
      </TableRow>
    )
  })
}
