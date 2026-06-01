import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"

import { impressumPublicQuery } from "#/legal/impressum/service/impressumQueries"
import { privacyPolicyPublicQuery } from "#/legal/privacy-policy/service/privacyPolicyQueries"
import RenderIf from "#/components/base/RenderIf"

export default function Footer() {
  const year = new Date().getFullYear()

  const { data: impressumData } = useQuery(impressumPublicQuery())
  const { data: privacyPolicyData } = useQuery(privacyPolicyPublicQuery())

  const impressumExists = impressumData?.exists ?? false
  const privacyPolicyExists = privacyPolicyData?.exists ?? false

  return (
    <footer className="border-t border-(--line) p-4 text-(--sea-ink-soft)">
      <div className="page-wrap flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm">
        <span>&copy; {year} Simon Hauck</span>
        <RenderIf when={impressumExists}>
          <span aria-hidden="true">·</span>
          <Link to="/impressum" className="hover:text-(--sea-ink) transition-colors">
            Impressum
          </Link>
        </RenderIf>
        <RenderIf when={privacyPolicyExists}>
          <span aria-hidden="true">·</span>
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-(--sea-ink) transition-colors"
          >
            Datenschutz
          </a>
        </RenderIf>
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/simonhauck/OpenFireStationManager"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-(--sea-ink) transition-colors"
        >
          GitHub
        </a>
      </div>
    </footer>
  )
}
