import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import type { ClothingItem } from "#/clothing/service/clothingItemsQueries"
import {
  createClothingItemMutation,
  updateClothingItemMutation,
} from "#/clothing/service/clothingItemsQueries"
import { useClothingTypes } from "#/clothing/service/clothingTypesQueries"
import ClothingLocationSelect from "#/clothing/components/shared/ClothingLocationSelect"
import ErrorState from "#/components/base/ErrorState"
import RenderIf from "#/components/base/RenderIf"
import { Button } from "#/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group"
import type { CreateOrUpdateClothingItemRequest } from "#/clothing/components/shared/CreateOrUpdateClothingItemRequest.tsx"

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
  const [locationId, setLocationId] = useState<string>(
    existingItem?.locationId ?? "",
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
    ? "Kleidungsstueck bearbeiten"
    : "Kleidungsstueck erstellen"
  const description = isEditing
    ? "Bearbeiten Sie die Daten des Kleidungsstuecks."
    : "Erfassen Sie die Daten fuer ein neues Kleidungsstueck."
  const submitLabel = "Speichern"
  const pendingLabel = "Wird gespeichert..."
  const errorMessage = error
    ? "Das Kleidungsstueck konnte nicht gespeichert werden."
    : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (typeId === null) return

    const body: CreateOrUpdateClothingItemRequest = {
      typeId,
      size,
      barcode: barcode,
      ...(locationId !== "" ? { locationId: { id: Number(locationId) } } : {}),
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
    <main className="page-wrap px-4 py-12">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Kleidungstyp</Label>
              <RenderIf when={types.length === 0}>
                <p className="text-sm text-muted-foreground">
                  Keine Kleidungstypen vorhanden.
                </p>
              </RenderIf>
              <RenderIf when={types.length > 0}>
                <RadioGroup
                  value={typeId !== null ? String(typeId) : ""}
                  onValueChange={(val) => setTypeId(Number(val))}
                  className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                >
                  {types.map((type) => (
                    <div key={type.id} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={String(type.id)}
                        id={`type-${type.id}`}
                      />
                      <Label htmlFor={`type-${type.id}`}>{type.name}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </RenderIf>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="size">Groesse</Label>
              <Input
                id="size"
                required
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="barcode">Barcode (optional)</Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>

            <ClothingLocationSelect
              selectedLocationId={locationId}
              onLocationChange={setLocationId}
            />

            <RenderIf when={errorMessage !== null}>
              <ErrorState message={errorMessage!} />
            </RenderIf>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/clothing-management/items">Abbrechen</Link>
              </Button>
              <Button type="submit" disabled={isPending || typeId === null}>
                {isPending ? pendingLabel : submitLabel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
