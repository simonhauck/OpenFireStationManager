import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput"
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList"
import { TextInput } from "@astryxdesign/core/TextInput"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import type { ClothingLocation } from "#/clothing/service/clothingLocationsQueries"
import {
  createClothingLocationMutation,
  updateClothingLocationMutation,
} from "#/clothing/service/clothingLocationsQueries"
import ErrorState from "#/components/base/ErrorState"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"
import MemberSelect from "#/members/components/shared/MemberSelect"

type LocationType = "POOL" | "WAESCHE" | "PERSONAL" | "OTHER"

const LOCATION_TYPE_OPTIONS: { value: LocationType; label: string }[] = [
  { value: "POOL", label: "Pool" },
  { value: "WAESCHE", label: "Wäsche" },
  { value: "PERSONAL", label: "Persönlicher Standort" },
  { value: "OTHER", label: "Sonstiges" },
]

type ClothingLocationFormProps = {
  existingLocation?: ClothingLocation
}

export default function ClothingLocationForm({
  existingLocation,
}: ClothingLocationFormProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const isEditing = existingLocation != null

  const [name, setName] = useState(existingLocation?.name ?? "")
  const [comment, setComment] = useState(existingLocation?.comment ?? "")
  const [onlyVisibleForKleiderwart, setOnlyVisibleForKleiderwart] = useState(
    existingLocation?.onlyVisibleForKleiderwart ?? false,
  )
  const [type, setType] = useState<LocationType | "">(
    existingLocation?.type ?? "",
  )
  const [memberId, setMemberId] = useState<number | undefined>(
    existingLocation?.memberId ?? undefined,
  )

  const isOwnedTypeChange =
    memberId !== undefined && type !== "" && type !== "PERSONAL"

  const {
    mutate: createLocation,
    isPending: isCreatePending,
    error: createError,
  } = useMutation(createClothingLocationMutation(queryClient))

  const {
    mutate: updateLocation,
    isPending: isUpdatePending,
    error: updateError,
  } = useMutation(updateClothingLocationMutation(queryClient))

  const isPending = isCreatePending || isUpdatePending
  const error = createError ?? updateError

  const title = isEditing ? "Standort bearbeiten" : "Standort erstellen"
  const description = isEditing
    ? "Bearbeiten Sie die Daten des Standorts."
    : "Erfassen Sie die Daten für einen neuen Standort."

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!type) return

    const body = {
      name,
      comment,
      onlyVisibleForKleiderwart,
      type,
      memberId,
    }

    if (isEditing) {
      updateLocation(
        { id: Number(existingLocation.id), body },
        {
          onSuccess: () => {
            void navigate({ to: "/clothing-management/locations" })
          },
        },
      )
    } else {
      createLocation(body, {
        onSuccess: () => {
          void navigate({ to: "/clothing-management/locations" })
        },
      })
    }
  }

  return (
    <PageSection title={title} subtitle={description}>
      <Card maxWidth={672} className="mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <RadioList
            label="Typ"
            isRequired
            value={type}
            onChange={(value) => setType(value as LocationType)}
          >
            {LOCATION_TYPE_OPTIONS.map((option) => (
              <RadioListItem
                key={option.value}
                value={option.value}
                label={option.label}
              />
            ))}
          </RadioList>

          <TextInput
            label="Bezeichnung"
            isRequired
            value={name}
            onChange={setName}
          />

          <RenderIf when={type === "PERSONAL"}>
            <MemberSelect
              selectedMemberId={memberId}
              onMemberChange={setMemberId}
            />
          </RenderIf>

          <TextInput label="Kommentar" value={comment} onChange={setComment} />

          <CheckboxInput
            label="Nur sichtbar für Kleiderwart"
            value={onlyVisibleForKleiderwart}
            onChange={setOnlyVisibleForKleiderwart}
          />

          <RenderIf when={!!error}>
            <ErrorState message="Der Standort konnte nicht gespeichert werden." />
          </RenderIf>

          <RenderIf when={isOwnedTypeChange}>
            <ErrorState message="Dieser Standort ist einem Mitglied zugewiesen. Wechseln Sie zurück zu 'Persönlicher Standort' und entfernen Sie das Mitglied, bevor Sie den Typ ändern." />
          </RenderIf>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              label="Abbrechen"
              variant="secondary"
              href="/clothing-management/locations"
            />
            <Button
              type="submit"
              label={isPending ? "Wird gespeichert..." : "Speichern"}
              variant="primary"
              isLoading={isPending}
              isDisabled={!type || isOwnedTypeChange}
            />
          </div>
        </form>
      </Card>
    </PageSection>
  )
}
