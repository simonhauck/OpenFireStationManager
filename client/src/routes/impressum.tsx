import { createFileRoute } from "@tanstack/react-router"
import ImpressumPage from "#/legal/impressum/components/ImpressumPage"

export const Route = createFileRoute("/impressum")({
  component: ImpressumRoute,
})

function ImpressumRoute() {
  return <ImpressumPage />
}
