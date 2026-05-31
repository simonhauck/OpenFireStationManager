import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { Pencil, Plus, Trash2 } from "lucide-react"

import {
  deleteImpressumMutation,
  impressumAdminQuery,
  upsertImpressumMutation,
} from "#/legal/impressum/service/impressumQueries"
import type { ImpressumDto } from "#/legal/impressum/service/impressumQueries"
import ImpressumDialog from "#/legal/impressum/components/ImpressumDialog"
import DeleteDialogComponent from "#/components/base/DeleteDialogComponent"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSubSection from "#/components/base/PageSubSection"
import RenderIf from "#/components/base/RenderIf"
import { Button } from "#/components/ui/button"

export default function ImpressumSection() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery(impressumAdminQuery())

  const impressum = data?.exists ? data.impressum : null

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { mutate: upsert, isPending: isUpserting } = useMutation(
    upsertImpressumMutation(queryClient),
  )
  const { mutate: deleteImpressum, isPending: isDeleting } = useMutation(
    deleteImpressumMutation(queryClient),
  )

  function handleSave(dto: ImpressumDto) {
    upsert(dto, {
      onSuccess: () => {
        toast.success("Impressum wurde gespeichert.")
        setIsDialogOpen(false)
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

      <RenderIf when={!isLoading && !isError}>
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
                <p className="text-muted-foreground">{impressum?.contactEmail}</p>
                <RenderIf when={!!impressum?.phone}>
                  <p className="text-muted-foreground">{impressum?.phone}</p>
                </RenderIf>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                >
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
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="size-4" />
              Impressum erstellen
            </Button>
          </RenderIf>
        </div>
      </RenderIf>

      <ImpressumDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialValues={impressum}
        onSave={handleSave}
        isSaving={isUpserting}
      />
    </PageSubSection>
  )
}
