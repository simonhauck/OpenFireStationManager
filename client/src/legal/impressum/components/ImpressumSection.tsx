import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { Pencil, Trash2 } from "lucide-react"

import {
  deleteImpressumMutation,
  impressumAdminQuery,
  upsertImpressumMutation,
} from "#/legal/impressum/service/impressumQueries"
import type { ImpressumRequest } from "#/legal/impressum/service/impressumQueries"
import DeleteDialogComponent from "#/components/base/DeleteDialogComponent"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSubSection from "#/components/base/PageSubSection"
import RenderIf from "#/components/base/RenderIf"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"

export default function ImpressumSection() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery(impressumAdminQuery())

  const impressum = data?.exists ? data.impressum : null

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [phone, setPhone] = useState("")

  const { mutate: upsert, isPending: isUpserting } = useMutation(
    upsertImpressumMutation(queryClient),
  )
  const { mutate: deleteImpressum, isPending: isDeleting } = useMutation(
    deleteImpressumMutation(queryClient),
  )

  function startEditing() {
    setName(impressum?.name ?? "")
    setAddress(impressum?.address ?? "")
    setContactEmail(impressum?.contactEmail ?? "")
    setPhone(impressum?.phone ?? "")
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
  }

  function handleSave() {
    const request: ImpressumRequest = {
      name,
      address,
      contactEmail,
      phone: phone.trim() || null,
    }

    upsert(request, {
      onSuccess: () => {
        toast.success("Impressum wurde gespeichert.")
        setIsEditing(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  function handleDelete() {
    deleteImpressum(undefined, {
      onSuccess: () => {
        toast.success("Impressum wurde gelöscht.")
        setIsEditing(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <PageSubSection
      title="Impressum"
      subtitle="Konfiguriere das öffentlich sichtbare Impressum der Anwendung."
    >
      <RenderIf when={isLoading}>
        <LoadingIndicator label="Impressum wird geladen..." />
      </RenderIf>

      <RenderIf when={isError}>
        <ErrorState message="Fehler beim Laden des Impressums." />
      </RenderIf>

      <RenderIf when={!isLoading && !isError && !isEditing}>
        <div className="flex flex-col gap-4">
          <RenderIf when={!!impressum}>
            <div
              data-testid="impressum-current"
              className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <div className="flex flex-col gap-1">
                <p className="font-medium">{impressum?.name}</p>
                <p className="whitespace-pre-line text-muted-foreground">
                  {impressum?.address}
                </p>
                <p className="text-muted-foreground">
                  {impressum?.contactEmail}
                </p>
                <RenderIf when={!!impressum?.phone}>
                  <p className="text-muted-foreground">{impressum?.phone}</p>
                </RenderIf>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Pencil className="size-4" />
                  Bearbeiten
                </Button>
                <DeleteDialogComponent
                  onDelete={handleDelete}
                  headline="Impressum löschen"
                  bodyText="Soll das aktuelle Impressum wirklich gelöscht werden? Danach ist es unter /impressum nicht mehr erreichbar."
                >
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="size-4" />
                    Löschen
                  </Button>
                </DeleteDialogComponent>
              </div>
            </div>
          </RenderIf>

          <RenderIf when={data?.exists === false}>
            <p
              data-testid="impressum-empty"
              className="text-sm text-muted-foreground"
            >
              Es wurde noch kein Impressum konfiguriert.
            </p>
          </RenderIf>

          <RenderIf when={data?.exists === false}>
            <Button
              variant="outline"
              className="self-start"
              onClick={startEditing}
            >
              <Pencil className="size-4" />
              Impressum erstellen
            </Button>
          </RenderIf>
        </div>
      </RenderIf>

      <RenderIf when={!isLoading && !isError && isEditing}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="impressum-name">Name *</Label>
            <Input
              id="impressum-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Freiwillige Feuerwehr Musterstadt"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="impressum-address">Adresse *</Label>
            <Textarea
              id="impressum-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={"Musterstraße 1\n12345 Musterstadt"}
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="impressum-email">Kontakt-E-Mail *</Label>
            <Input
              id="impressum-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="info@feuerwehr-musterstadt.de"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="impressum-phone">Telefonnummer (optional)</Label>
            <Input
              id="impressum-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 123 456789"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!name || !address || !contactEmail || isUpserting}
            >
              Speichern
            </Button>
            <Button
              variant="outline"
              onClick={cancelEditing}
              disabled={isUpserting}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      </RenderIf>
    </PageSubSection>
  )
}
