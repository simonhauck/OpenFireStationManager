import PageSection from "#/components/base/PageSection"
import PageSubSection from "#/components/base/PageSubSection"
import RoleGuard from "#/components/base/RoleGuard"
import PrivacyPolicySection from "#/legal/privacy-policy/components/PrivacyPolicySection"
import ImpressumSection from "#/legal/impressum/components/ImpressumSection"
import { useKiosk } from "#/components/kiosk/KioskProvider"
import { Switch } from "#/components/ui/switch"
import { Label } from "#/components/ui/label"

export default function AdminSettingsPage() {
  const { kioskEnabled, setKioskEnabled } = useKiosk()

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <PageSection
        title="Admin Einstellungen"
        subtitle="Verwaltung der anwendungsweiten Einstellungen"
      >
        <PrivacyPolicySection />
        <ImpressumSection />
        <PageSubSection
          title="Kiosk Modus"
          subtitle="Aktiviert die Bildschirmtastatur für Geräte ohne physische Tastatur"
        >
          <div className="flex items-center gap-2">
            <Switch
              id="kiosk-toggle"
              checked={kioskEnabled}
              onCheckedChange={setKioskEnabled}
            />
            <Label htmlFor="kiosk-toggle">
              {kioskEnabled
                ? "Bildschirmtastatur aktiviert"
                : "Bildschirmtastatur deaktiviert"}
            </Label>
          </div>
        </PageSubSection>
      </PageSection>
    </RoleGuard>
  )
}
