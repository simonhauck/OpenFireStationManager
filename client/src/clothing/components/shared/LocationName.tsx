import { Text } from "@astryxdesign/core/Text"
import EntityNameLink from "#/components/base/EntityNameLink"

type LocationNameProps = {
  locationId?: number
  name?: string
}

/**
 * Renders a Standort reference. A standalone reference links to the Standort's
 * edit page; without an id the name stays plain text, and a missing name falls
 * back to the muted dash used by MemberName.
 */
export default function LocationName({ locationId, name }: LocationNameProps) {
  if (name === undefined) {
    return <Text type="supporting">–</Text>
  }

  if (locationId === undefined) {
    return <>{name}</>
  }

  return (
    <EntityNameLink href={`/clothing-management/locations/${locationId}/edit`}>
      {name}
    </EntityNameLink>
  )
}
