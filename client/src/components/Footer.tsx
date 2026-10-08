import { Link } from "@astryxdesign/core/Link"
import { Text } from "@astryxdesign/core/Text"
import { useQuery } from "@tanstack/react-query"
import RenderIf from "#/components/base/RenderIf"
import { impressumPublicQuery } from "#/legal/impressum/service/impressumQueries"
import { privacyPolicyPublicQuery } from "#/legal/privacy-policy/service/privacyPolicyQueries"

export default function Footer() {
  const year = new Date().getFullYear()

  const { data: impressumData } = useQuery(impressumPublicQuery())
  const { data: privacyPolicyData } = useQuery(privacyPolicyPublicQuery())

  const impressumExists = impressumData?.exists ?? false
  const privacyPolicyExists = privacyPolicyData?.exists ?? false

  return (
    <footer className="border-border border-t p-4">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
        <Text type="supporting">&copy; {year} Simon Hauck</Text>
        <RenderIf when={impressumExists}>
          <Text type="supporting" aria-hidden="true">
            ·
          </Text>
          <Link href="/impressum">Impressum</Link>
        </RenderIf>
        <RenderIf when={privacyPolicyExists}>
          <Text type="supporting" aria-hidden="true">
            ·
          </Text>
          <Link
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Datenschutz
          </Link>
        </RenderIf>
        <Text type="supporting" aria-hidden="true">
          ·
        </Text>
        <Link
          href="https://github.com/simonhauck/OpenFireStationManager"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </Link>
      </div>
    </footer>
  )
}
