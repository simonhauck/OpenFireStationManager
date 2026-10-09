import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { TextInput } from "@astryxdesign/core/TextInput"
import type { ReactNode } from "react"

import ErrorState from "#/components/base/ErrorState"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"

type ClothingTypeFormProps = {
  title: string
  description: string
  name: string
  onNameChange: (name: string) => void
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
  pendingLabel: string
  submitLabel: string
  errorMessage: string | null
  /** Optional images section rendered between the name field and the actions. */
  images?: ReactNode
}

export default function ClothingTypeForm({
  title,
  description,
  name,
  onNameChange,
  onSubmit,
  isPending,
  pendingLabel,
  submitLabel,
  errorMessage,
  images,
}: ClothingTypeFormProps) {
  return (
    <PageSection title={title} subtitle={description}>
      <Card maxWidth={672} className="mx-auto w-full">
        <form onSubmit={onSubmit} className="space-y-4">
          <TextInput
            label="Bezeichnung"
            isRequired
            value={name}
            onChange={onNameChange}
          />

          <RenderIf when={images !== undefined}>{images}</RenderIf>

          <RenderIf when={errorMessage !== null}>
            <ErrorState message={errorMessage ?? "Unbekannter Fehler."} />
          </RenderIf>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              label="Abbrechen"
              variant="secondary"
              href="/clothing-management/types"
            />
            <Button
              type="submit"
              label={isPending ? pendingLabel : submitLabel}
              variant="primary"
              isLoading={isPending}
            />
          </div>
        </form>
      </Card>
    </PageSection>
  )
}
