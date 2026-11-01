import { Button } from "@astryxdesign/core/Button"
import type { TableSortState } from "@astryxdesign/core/Table"
import { Text } from "@astryxdesign/core/Text"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "@tanstack/react-router"
import { Pencil, Trash2 } from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"

import ClothingItemsTable, {
  type ClothingItemColumnKey,
} from "#/clothing/components/items/list/ClothingItemsTable"
import DeleteClothingLocationDialog from "#/clothing/components/locations/shared/DeleteClothingLocationDialog"
import { LOCATION_TYPE_LABELS } from "#/clothing/components/shared/clothingLocationLabel"
import type { ClothingLocation } from "#/clothing/model/clothingLocations"
import {
  getClothingLocationItemsQuery,
  useClothingLocationById,
} from "#/clothing/service/clothingLocationsQueries"
import ErrorState from "#/components/base/ErrorState"
import FormattedDate from "#/components/base/FormattedDate"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import PageSubSection from "#/components/base/PageSubSection"
import RenderIf from "#/components/base/RenderIf"
import RoleGuard from "#/components/base/RoleGuard"
import MemberName from "#/members/components/shared/MemberName"

const LOCATION_ITEM_COLUMNS: ReadonlyArray<ClothingItemColumnKey> = [
  "id",
  "type",
  "size",
  "barcode",
  "manufacturerBarcode",
  "member",
  "createdAt",
]

const LOCATION_DEFAULT_SORT: TableSortState = [
  { sortKey: "type", direction: "ascending" },
  { sortKey: "size", direction: "ascending" },
]

export default function LocationDetailPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <LocationDetailPageContent />
    </RoleGuard>
  )
}

function LocationDetailPageContent() {
  const { clothingLocationId } = useParams({
    from: "/_authenticated/clothing-management/locations/$clothingLocationId/",
  })
  const numericLocationId = Number(clothingLocationId)
  const hasValidId = Number.isFinite(numericLocationId)

  const {
    data: location,
    isLoading,
    isError,
  } = useClothingLocationById(numericLocationId)

  if (!hasValidId) {
    return <ErrorState message="Ungültige Standort-ID." />
  }

  if (isLoading) {
    return <LoadingIndicator label="Standort wird geladen..." />
  }

  if (isError || !location) {
    return <ErrorState message="Standort konnte nicht geladen werden." />
  }

  return <LocationDetailContent location={location} />
}

function LocationDetailContent({ location }: { location: ClothingLocation }) {
  const navigate = useNavigate()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  return (
    <>
      <PageSection
        title={location.name}
        subtitle="Standort"
        buttons={
          <div className="flex flex-wrap gap-2">
            <Button
              label="Bearbeiten"
              icon={<Pencil className="size-4" />}
              variant="secondary"
              href={`/clothing-management/locations/${location.id}/edit`}
            />
            <Button
              label="Löschen"
              icon={<Trash2 className="size-4" />}
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            />
          </div>
        }
      >
        <LocationDetailsSection location={location} />

        <LocationClothingSection locationId={location.id} />
      </PageSection>

      <DeleteClothingLocationDialog
        location={location}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDeleted={() => {
          void navigate({ to: "/clothing-management/locations" })
        }}
      />
    </>
  )
}

function LocationDetailsSection({ location }: { location: ClothingLocation }) {
  return (
    <PageSubSection title="Details">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-[10rem_1fr] md:gap-y-1">
        <DetailRow label="Typ">{LOCATION_TYPE_LABELS[location.type]}</DetailRow>
        <DetailRow label="Mitglied">
          <MemberName memberId={location.memberId} />
        </DetailRow>
        <DetailRow label="Kommentar">{location.comment || "–"}</DetailRow>
        <DetailRow label="Nur Kleiderwart">
          {location.onlyVisibleForKleiderwart ? "Ja" : "Nein"}
        </DetailRow>
        <DetailRow label="Erstellt am">
          <FormattedDate value={location.metaData.createdAt} /> von{" "}
          {location.metaData.createdBy}
        </DetailRow>
        <DetailRow label="Zuletzt geändert am">
          <FormattedDate value={location.metaData.lastModifiedAt} /> von{" "}
          {location.metaData.lastModifiedBy}
        </DetailRow>
      </dl>
    </PageSubSection>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="contents">
      <dt>
        <Text as="span" type="supporting">
          {label}
        </Text>
      </dt>
      <dd>
        <Text as="span">{children}</Text>
      </dd>
    </div>
  )
}

function LocationClothingSection({ locationId }: { locationId: number }) {
  const itemsQuery = useQuery(getClothingLocationItemsQuery(locationId))
  const itemCount = itemsQuery.data?.length

  return (
    <PageSubSection
      title="Kleidung"
      subtitle="Kleidungsstücke an diesem Standort"
      right={
        itemCount === undefined ? undefined : (
          <Text as="span" type="supporting">
            {formatCount(itemCount, "Kleidungsstück", "Kleidungsstücke")}
          </Text>
        )
      }
    >
      <RenderIf when={itemsQuery.isLoading}>
        <LoadingIndicator label="Kleidung wird geladen..." />
      </RenderIf>

      <RenderIf when={itemsQuery.isError}>
        <ErrorState message="Kleidung konnte nicht geladen werden." />
      </RenderIf>

      <RenderIf when={itemsQuery.data !== undefined}>
        <ClothingItemsTable
          items={itemsQuery.data ?? []}
          columnKeys={LOCATION_ITEM_COLUMNS}
          linkItemLabels
          searchLabel="Kleidung durchsuchen"
          searchPlaceholder="Kleidung durchsuchen..."
          emptyStateTitle="Keine Kleidung an diesem Standort."
          defaultSort={LOCATION_DEFAULT_SORT}
        />
      </RenderIf>
    </PageSubSection>
  )
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
