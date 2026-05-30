import PageSection from "#/components/base/PageSection"
import RoleGuard from "#/components/base/RoleGuard"
import PrivacyPolicySection from "#/admin/components/PrivacyPolicySection"

export default function AdminSettingsPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <PageSection
        title="Admin Einstellungen"
        subtitle="Verwaltung der anwendungsweiten Einstellungen"
      >
        <PrivacyPolicySection />
      </PageSection>
    </RoleGuard>
  )
}
