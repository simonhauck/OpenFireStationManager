import { Text } from "@astryxdesign/core/Text"
import RenderIf from "#/components/base/RenderIf"
import type { ImpressumDto } from "#/legal/model/legal"

interface ImpressumDetailsProps {
  impressum: ImpressumDto | null
}

/**
 * Renders the stored Impressum values. The phone number is optional and only rendered when set.
 */
export default function ImpressumDetails({ impressum }: ImpressumDetailsProps) {
  if (!impressum) {
    return null
  }

  return (
    <div className="flex flex-col gap-1">
      <Text weight="medium">{impressum.name}</Text>
      <Text type="supporting" className="whitespace-pre-line">
        {impressum.address}
      </Text>
      <Text type="supporting">{impressum.contactEmail}</Text>
      <RenderIf when={!!impressum.phone}>
        <Text type="supporting">{impressum.phone}</Text>
      </RenderIf>
    </div>
  )
}
