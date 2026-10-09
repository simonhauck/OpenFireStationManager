import { AlertDialog } from "@astryxdesign/core/AlertDialog"
import { Button } from "@astryxdesign/core/Button"
import { Text } from "@astryxdesign/core/Text"
import { useToast } from "@astryxdesign/core/Toast"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import ErrorState from "#/components/base/ErrorState"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSubSection from "#/components/base/PageSubSection"
import RenderIf from "#/components/base/RenderIf"
import ImpressumDialog from "#/legal/impressum/components/ImpressumDialog"
import {
  deleteImpressumMutation,
  impressumAdminQuery,
} from "#/legal/impressum/service/impressumQueries"

export default function ImpressumSection() {
  const queryClient = useQueryClient()
  const showToast = useToast()
  const { data, isLoading, isError } = useQuery(impressumAdminQuery())

  const impressum = data?.exists ? data.impressum : null

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const { mutate: deleteImpressum, isPending: isDeleting } = useMutation(
    deleteImpressumMutation(queryClient),
  )

  function handleDelete() {
    deleteImpressum(undefined, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        showToast({ body: "Impressum wurde gelöscht.", type: "info" })
      },
      onError: (error) => {
        showToast({ body: error.message, type: "error", isAutoHide: true })
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
              className="border-border bg-card flex flex-wrap items-start justify-between gap-3 rounded-md border px-3 py-2"
            >
              <div className="flex flex-col gap-1">
                <Text weight="medium">{impressum?.name}</Text>
                <Text type="supporting" className="whitespace-pre-line">
                  {impressum?.address}
                </Text>
                <Text type="supporting">{impressum?.contactEmail}</Text>
                <RenderIf when={!!impressum?.phone}>
                  <Text type="supporting">{impressum?.phone}</Text>
                </RenderIf>
              </div>
              <div className="flex gap-2">
                <Button
                  label="Bearbeiten"
                  icon={<Pencil className="size-4" />}
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                />
                <Button
                  label="Löschen"
                  icon={<Trash2 className="size-4" />}
                  variant="destructive"
                  size="sm"
                  isDisabled={isDeleting}
                  onClick={() => setIsDeleteDialogOpen(true)}
                />
              </div>
            </div>
          </RenderIf>

          <RenderIf when={data?.exists === false}>
            <Text type="supporting" data-testid="impressum-empty">
              Es wurde noch kein Impressum konfiguriert.
            </Text>
          </RenderIf>

          <RenderIf when={data?.exists === false}>
            <Button
              label="Impressum erstellen"
              icon={<Plus className="size-4" />}
              variant="secondary"
              className="self-start"
              onClick={() => setIsDialogOpen(true)}
            />
          </RenderIf>
        </div>
      </RenderIf>

      <ImpressumDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialValues={impressum}
      />

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Impressum löschen"
        description="Soll das aktuelle Impressum wirklich gelöscht werden? Danach ist es unter /impressum nicht mehr erreichbar."
        actionLabel="Löschen"
        onAction={handleDelete}
        cancelLabel="Abbrechen"
        actionVariant="destructive"
      />
    </PageSubSection>
  )
}
