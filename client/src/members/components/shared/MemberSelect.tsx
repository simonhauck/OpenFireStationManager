import { Selector } from "@astryxdesign/core/Selector"
import type { Member } from "#/members/model/member.ts"
import { useMembers } from "#/members/service/memberQueries"

type MemberSelectProps = {
  selectedMemberId: number | undefined
  onMemberChange: (id: number | undefined) => void
}

export default function MemberSelect({
  selectedMemberId,
  onMemberChange,
}: MemberSelectProps) {
  const { data: members } = useMembers()

  const allMembers: Member[] = members ?? []

  return (
    <Selector
      label="Mitglied"
      options={allMembers.map((member) => ({
        value: String(member.id),
        label: member.name,
      }))}
      value={selectedMemberId === undefined ? null : String(selectedMemberId)}
      onChange={(value) =>
        onMemberChange(value === null ? undefined : Number(value))
      }
      hasClear
      hasSearch
      searchPlaceholder="Mitglied suchen..."
      emptySearchText="Kein Mitglied gefunden."
      placeholder="--- Kein Mitglied ---"
      width="100%"
    />
  )
}
