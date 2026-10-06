import ClearableCombobox from "#/components/base/ClearableCombobox"
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
  const selectedMember = allMembers.find(
    (member) => member.id === selectedMemberId,
  )

  return (
    <ClearableCombobox<Member>
      id="member"
      label="Mitglied"
      noItemSelectedLabel="--- Kein Mitglied ---"
      canClear={true}
      options={allMembers}
      selectedValue={selectedMember}
      onValueChange={(member) => onMemberChange(member?.id)}
      toDisplayString={(member) => member.name}
      toKey={(member) => String(member.id)}
      searchPlaceholder="Mitglied suchen..."
      emptyMessage="Kein Mitglied gefunden."
    />
  )
}
