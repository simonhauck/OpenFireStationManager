import PageSection from "#/components/base/PageSection"
import RoleGuard from "#/components/base/RoleGuard"
import ImpressumSection from "#/legal/impressum/components/ImpressumSection"
import PrivacyPolicySection from "#/legal/privacy-policy/components/PrivacyPolicySection"

export default function AdminSettingsPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <PageSection
        title="Admin Einstellungen"
        subtitle="Verwaltung der anwendungsweiten Einstellungen"
      >
        <PrivacyPolicySection />
        <ImpressumSection />
      </PageSection>
    </RoleGuard>
  )
}
