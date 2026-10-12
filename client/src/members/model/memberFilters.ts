import type { ClothingLocation } from "#/clothing/model/clothingLocations.ts"
import { formatDate } from "#/lib/date"
import type { Member } from "#/members/model/member.ts"

/**
 * Filters members by a comma-separated, case-insensitive search term. A member matches when every
 * term appears in its name, one of its Standort names, or its formatted creation date.
 */
export function filterMembers(
  members: Member[],
  locationsByMember: Map<number, ClothingLocation[]>,
  searchTerm: string,
): Member[] {
  const terms = searchTerm
    .toLowerCase()
    .split(",")
    .map((term) => term.trim())
    .filter((term) => term.length > 0)

  if (terms.length === 0) {
    return members
  }

  return members.filter((member) => {
    const memberLocations = locationsByMember.get(member.id) ?? []
    const haystack = [
      member.name,
      ...memberLocations.map((location) => location.name),
      formatDate(member.metaData.createdAt) ?? "",
    ]
      .join(" ")
      .toLowerCase()

    return terms.every((term) => haystack.includes(term))
  })
}

/**
 * Returns true when a member with the same name (trimmed, case-insensitive) already exists.
 */
export function hasDuplicateMemberName(
  members: Member[],
  name: string,
): boolean {
  const normalizedName = name.trim().toLowerCase()
  return members.some(
    (member) => member.name.trim().toLowerCase() === normalizedName,
  )
}

/** Formats a count with the correct German singular/plural noun. */
export function formatCount(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count} ${count === 1 ? singular : plural}`
}
