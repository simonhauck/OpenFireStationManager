import ClothingItemRow from "#/clothing/components/shared/ClothingItemRow"
import type { ResolvedClothingItem } from "#/clothing/model/clothingItems.ts"
import type { ClothingLocation } from "#/clothing/model/clothingLocations.ts"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSubSection from "#/components/base/PageSubSection"
import RenderIf from "#/components/base/RenderIf"

export interface MemberClothingGroupData {
  location: ClothingLocation
  items: ResolvedClothingItem[] | undefined
  isLoading: boolean
  isError: boolean
}

interface MemberClothingSectionProps {
  groups: MemberClothingGroupData[]
}

export default function MemberClothingSection({
  groups,
}: MemberClothingSectionProps) {
  return (
    <PageSubSection
      title="Kleidung"
      subtitle="Kleidungsstücke in den Standorten dieses Mitglieds"
    >
      <RenderIf when={groups.length === 0}>
        <p className="text-muted-foreground text-sm">
          Keine Kleidung, da keine Standorte zugewiesen sind.
        </p>
      </RenderIf>

      <div className="space-y-6">
        {groups.map((group) => (
          <MemberClothingGroup key={group.location.id} group={group} />
        ))}
      </div>
    </PageSubSection>
  )
}

interface MemberClothingGroupProps {
  group: MemberClothingGroupData
}

function MemberClothingGroup({ group }: MemberClothingGroupProps) {
  const { location, items, isLoading, isError } = group

  return (
    <div data-testid="clothing-group" className="space-y-2">
      <h3 className="text-base font-medium">{location.name}</h3>

      <RenderIf when={isLoading}>
        <LoadingIndicator label="Kleidung wird geladen..." />
      </RenderIf>

      <RenderIf when={isError}>
        <ErrorState message="Kleidung konnte nicht geladen werden." />
      </RenderIf>

      <RenderIf when={items !== undefined && items.length === 0}>
        <p className="text-muted-foreground text-sm">
          Keine Kleidung an diesem Standort.
        </p>
      </RenderIf>

      {(items ?? []).map((item) => (
        <ClothingItemRow key={item.clothingItem.id} item={item} />
      ))}
    </div>
  )
}
