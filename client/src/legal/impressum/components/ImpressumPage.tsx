import { useQuery } from "@tanstack/react-query"

import { impressumPublicQuery } from "#/legal/impressum/service/impressumQueries"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"

export default function ImpressumPage() {
  const { data, isLoading, isError } = useQuery(impressumPublicQuery())

  if (isLoading) {
    return <LoadingIndicator label="Impressum wird geladen..." />
  }

  if (isError) {
    return <ErrorState message="Fehler beim Laden des Impressums." />
  }

  return (
    <PageSection title="Impressum">
      <RenderIf when={data?.exists === false}>
        <p className="text-sm text-muted-foreground">
          Kein Impressum vorhanden.
        </p>
      </RenderIf>

      <RenderIf when={data?.exists === true}>
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-lg font-semibold">{data?.impressum?.name}</p>
          <p className="whitespace-pre-line text-muted-foreground">
            {data?.impressum?.address}
          </p>
          <p className="text-muted-foreground">
            {data?.impressum?.contactEmail}
          </p>
          <RenderIf when={!!data?.impressum?.phone}>
            <p className="text-muted-foreground">{data?.impressum?.phone}</p>
          </RenderIf>
        </div>
      </RenderIf>
    </PageSection>
  )
}
