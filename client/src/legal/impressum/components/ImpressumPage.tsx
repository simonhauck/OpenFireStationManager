import { Heading } from "@astryxdesign/core/Heading"
import { Text } from "@astryxdesign/core/Text"
import { useQuery } from "@tanstack/react-query"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import { impressumPublicQuery } from "#/legal/impressum/service/impressumQueries"

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
        <Text type="supporting" as="p">
          Kein Impressum vorhanden.
        </Text>
      </RenderIf>

      <RenderIf when={data?.exists === true}>
        <div className="flex flex-col gap-2">
          <Heading level={2}>{data?.impressum?.name}</Heading>
          <Text type="supporting" className="whitespace-pre-line">
            {data?.impressum?.address}
          </Text>
          <Text type="supporting">{data?.impressum?.contactEmail}</Text>
          <RenderIf when={!!data?.impressum?.phone}>
            <Text type="supporting">{data?.impressum?.phone}</Text>
          </RenderIf>
        </div>
      </RenderIf>
    </PageSection>
  )
}
