import { Text } from "@astryxdesign/core/Text"
import EntityNameLink from "#/components/base/EntityNameLink"
import { useMemberNameLookup } from "#/members/service/memberQueries"

type MemberNameProps = {
  memberId?: number
  name?: string
}

export default function MemberName({ memberId, name }: MemberNameProps) {
  const lookupMemberName = useMemberNameLookup()
  const resolvedName = name ?? lookupMemberName(memberId)

  if (resolvedName === undefined) {
    return <Text type="supporting">–</Text>
  }

  if (memberId === undefined) {
    return <>{resolvedName}</>
  }

  return (
    <EntityNameLink href={`/members/${memberId}`}>
      {resolvedName}
    </EntityNameLink>
  )
}
