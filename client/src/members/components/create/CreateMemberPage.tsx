import RoleGuard from "#/components/base/RoleGuard"
import MemberForm from "#/members/components/shared/MemberForm"

export default function CreateMemberPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <MemberForm />
    </RoleGuard>
  )
}
