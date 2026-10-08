import { Button } from "@astryxdesign/core/Button"
import { Card } from "@astryxdesign/core/Card"
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList"
import { TextInput } from "@astryxdesign/core/TextInput"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import ClothingLocationSelect from "#/clothing/components/shared/ClothingLocationSelect"
import type { CreateOrUpdateClothingItemRequest } from "#/clothing/model/clothingItems"
import type { ClothingItem } from "#/clothing/service/clothingItemsQueries"
import {
  createClothingItemMutation,
  updateClothingItemMutation,
} from "#/clothing/service/clothingItemsQueries"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
import ErrorState from "#/components/base/ErrorState"
import PageSection from "#/components/base/PageSection"
import RenderIf from "#/components/base/RenderIf"

type ClothingItemFormProps = {
  existingItem?: ClothingItem
}

export default function ClothingItemForm({
  existingItem,
}: ClothingItemFormProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const isEditing = existingItem != null

  const [typeId, setTypeId] = useState<number | null>(
    existingItem != null ? Number(existingItem.typeId) : null,
  )
  const [size, setSize] = useState(existingItem?.size ?? "")
  const [barcode, setBarcode] = useState(existingItem?.barcode ?? "")
  const [locationId, setLocationId] = useState<number | undefined>(
    existingItem?.locationId,
  )

  const { data: clothingTypes } = useClothingTypes()

  const {
    mutate: createItem,
    isPending: isCreatePending,
    error: createError,
  } = useMutation(createClothingItemMutation(queryClient))

  const {
    mutate: updateItem,
    isPending: isUpdatePending,
    error: updateError,
  } = useMutation(updateClothingItemMutation(queryClient))

  const isPending = isCreatePending || isUpdatePending
  const error = createError ?? updateError

  const title = isEditing
    ? "Kleidungsstück bearbeiten"
    : "Kleidungsstück erstellen"
  const description = isEditing
    ? "Bearbeiten Sie die Daten des Kleidungsstücks."
    : "Erfassen Sie die Daten für ein neues Kleidungsstück."
  const submitLabel = "Speichern"
  const pendingLabel = "Wird gespeichert..."
  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : "Das Kleidungsstück konnte nicht gespeichert werden."
    : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (typeId === null) return

    const body: CreateOrUpdateClothingItemRequest = {
      typeId,
      size,
      barcode: barcode,
      locationId: locationId,
    }

    if (isEditing) {
      updateItem(
        {
          id: Number(existingItem.id),
          body: body,
        },
        {
          onSuccess: () => {
            void navigate({ to: "/clothing-management/items" })
          },
        },
      )
    } else {
      createItem(body, {
        onSuccess: () => {
          void navigate({ to: "/clothing-management/items" })
        },
      })
    }
  }

  const types = clothingTypes ?? []

  return (
    <PageSection title={title} subtitle={description}>
      <Card maxWidth={672} className="mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <RenderIf when={types.length === 0}>
            <p className="text-muted-foreground text-sm">
              Keine Kleidungstypen vorhanden.
            </p>
          </RenderIf>

          <RenderIf when={types.length > 0}>
            <RadioList
              label="Kleidungstyp"
              isRequired
              value={typeId !== null ? String(typeId) : ""}
              onChange={(value) => setTypeId(Number(value))}
            >
              {types.map((type) => (
                <RadioListItem
                  key={type.id}
                  value={String(type.id)}
                  label={type.name}
                />
              ))}
            </RadioList>
          </RenderIf>

          <TextInput label="Größe" isRequired value={size} onChange={setSize} />

          <TextInput
            label="Barcode (optional)"
            value={barcode}
            onChange={setBarcode}
          />

          <ClothingLocationSelect
            selectedLocationId={locationId}
            onLocationChange={setLocationId}
          />

          <RenderIf when={errorMessage !== null}>
            <ErrorState message={errorMessage ?? "Unbekannter Fehler."} />
          </RenderIf>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              label="Abbrechen"
              variant="secondary"
              href="/clothing-management/items"
            />
            <Button
              type="submit"
              label={isPending ? pendingLabel : submitLabel}
              variant="primary"
              isLoading={isPending}
              isDisabled={typeId === null}
            />
          </div>
        </form>
      </Card>
    </PageSection>
  )
}
