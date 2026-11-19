import { Button } from "@astryxdesign/core/Button"
import { Text } from "@astryxdesign/core/Text"
import { useRef } from "react"
import { LOGOUT_ENDPOINT } from "#/api/auth.utils"
import PageSection from "#/components/base/PageSection"

interface NoAccessPageProps {
  /** Display name of the signed-in user. */
  fullName: string
}

/** Shown instead of any page when the signed-in user holds no OFSM role. */
export default function NoAccessPage({ fullName }: NoAccessPageProps) {
  const logoutForm = useRef<HTMLFormElement>(null)

  // Same mechanism as AuthButton: a top-level form POST, so the browser can follow the redirect
  // to the provider's logout page.
  function handleLogout() {
    logoutForm.current?.submit()
  }

  return (
    <PageSection
      title="Kein Zugriff"
      subtitle={`Angemeldet als ${fullName}`}
    >
      <form
        ref={logoutForm}
        method="post"
        action={LOGOUT_ENDPOINT}
        className="hidden"
        aria-hidden="true"
      />
      <div className="flex flex-col items-start gap-4">
        <Text as="p">
          Ihrem Konto ist keine Rolle in der Feuerwehrverwaltung zugewiesen.
          Bitte wenden Sie sich an die Administratorin oder den Administrator
          Ihrer Feuerwehr, um Zugriff zu erhalten.
        </Text>
        <Button label="Abmelden" variant="secondary" onClick={handleLogout} />
      </div>
    </PageSection>
  )
}
