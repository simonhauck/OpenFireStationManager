import { useParams } from "@tanstack/react-router"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import RoleGuard from "#/components/base/RoleGuard"
import MemberForm from "#/members/components/shared/MemberForm"
import { useMemberById } from "#/members/service/memberQueries"

export default function EditMemberPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <EditMemberPageContent />
    </RoleGuard>
  )
}

function EditMemberPageContent() {
  const { memberId } = useParams({
    from: "/_authenticated/members/$memberId/edit",
  })
  const numericMemberId = Number(memberId)
  const { data: member, isLoading, isError } = useMemberById(numericMemberId)

  if (!Number.isFinite(numericMemberId)) {
    return <ErrorState message="Ungültige Mitglied-ID." />
  }

  if (isLoading) {
    return <LoadingIndicator label="Mitglied wird geladen..." />
  }

  if (isError || !member) {
    return <ErrorState message="Mitglied konnte nicht geladen werden." />
  }

  return <MemberForm existingMember={member} />
}
