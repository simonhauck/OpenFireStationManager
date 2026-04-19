import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import type { ClothingLocation } from "#/clothing/service/clothingLocationsQueries"
import {
  createClothingLocationMutation,
  updateClothingLocationMutation,
} from "#/clothing/service/clothingLocationsQueries"
import ErrorState from "#/components/base/ErrorState"
import { Button } from "#/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"
import { Checkbox } from "#/components/ui/checkbox"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"

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
  const [shouldBeShownOnDashboard, setShouldBeShownOnDashboard] = useState(
    existingLocation?.shouldBeShownOnDashboard ?? false,
  )

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
    : "Erfassen Sie die Daten fuer einen neuen Standort."

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const body = {
      name,
      comment,
      onlyVisibleForKleiderwart,
      shouldBeShownOnDashboard,
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
    <main className="page-wrap px-4 py-12">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Bezeichnung</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comment">Kommentar</Label>
              <Input
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="onlyVisibleForKleiderwart"
                checked={onlyVisibleForKleiderwart}
                onCheckedChange={(checked) =>
                  setOnlyVisibleForKleiderwart(checked === true)
                }
              />
              <Label htmlFor="onlyVisibleForKleiderwart">
                Nur sichtbar fuer Kleiderwart
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="shouldBeShownOnDashboard"
                checked={shouldBeShownOnDashboard}
                onCheckedChange={(checked) =>
                  setShouldBeShownOnDashboard(checked === true)
                }
              />
              <Label htmlFor="shouldBeShownOnDashboard">
                Auf Dashboard anzeigen
              </Label>
            </div>

            {error && (
              <ErrorState message="Der Standort konnte nicht gespeichert werden." />
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/clothing-management/locations">Abbrechen</Link>
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Wird gespeichert..." : "Speichern"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
