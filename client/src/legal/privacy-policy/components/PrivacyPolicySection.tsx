import { AlertDialog } from "@astryxdesign/core/AlertDialog"
import { Button } from "@astryxdesign/core/Button"
import { FileInput } from "@astryxdesign/core/FileInput"
import { Text } from "@astryxdesign/core/Text"
import { useToast } from "@astryxdesign/core/Toast"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ExternalLink, Trash2, Upload } from "lucide-react"
import { useState } from "react"
import ErrorState from "#/components/base/ErrorState"
import FormattedDate from "#/components/base/FormattedDate"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSubSection from "#/components/base/PageSubSection"
import RenderIf from "#/components/base/RenderIf"
import {
  deletePrivacyPolicyMutation,
  privacyPolicyQuery,
  uploadPrivacyPolicyMutation,
} from "#/legal/privacy-policy/service/privacyPolicyQueries"

const ACCEPTED_TYPES =
  ".pdf,.html,.htm,.txt,application/pdf,text/html,text/plain"

export default function PrivacyPolicySection() {
  const queryClient = useQueryClient()
  const showToast = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const { data, isLoading, isError } = useQuery(privacyPolicyQuery())

  const metadata = data?.exists ? data.metadata : null

  const { mutate: uploadDocument, isPending: isUploading } = useMutation(
    uploadPrivacyPolicyMutation(queryClient),
  )
  const { mutate: deleteDocument, isPending: isDeleting } = useMutation(
    deletePrivacyPolicyMutation(queryClient),
  )

  function handleUpload() {
    if (!selectedFile) {
      return
    }

    uploadDocument(selectedFile, {
      onSuccess: () => {
        showToast({
          body: "Datenschutzerklärung wurde hochgeladen.",
          type: "info",
        })
        setSelectedFile(null)
      },
      onError: (error) => {
        showToast({ body: error.message, type: "error", isAutoHide: true })
      },
    })
  }

  function handleDelete() {
    deleteDocument(undefined, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setSelectedFile(null)
        showToast({
          body: "Datenschutzerklärung wurde gelöscht.",
          type: "info",
        })
      },
      onError: (error) => {
        showToast({ body: error.message, type: "error", isAutoHide: true })
      },
    })
  }

  return (
    <PageSubSection
      title="Datenschutzerklärung"
      subtitle="Lade die öffentlich verfügbare Datenschutzerklärung hoch (PDF, HTML oder Text, max. 10 MB)."
      right={
        <Button
          label="Datenschutzerklärung aufrufen"
          icon={<ExternalLink className="size-4" />}
          variant="secondary"
          size="sm"
          href="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
        />
      }
    >
      <RenderIf when={isLoading}>
        <LoadingIndicator label="Datenschutzerklärung wird geladen..." />
      </RenderIf>

      <RenderIf when={isError}>
        <ErrorState message="Fehler beim Laden der Datenschutzerklärung." />
      </RenderIf>

      <RenderIf when={!isLoading && !isError}>
        <div className="flex flex-col gap-4">
          <RenderIf when={!!metadata}>
            <div
              data-testid="privacy-policy-current"
              className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2"
            >
              <div>
                <Text weight="medium">{metadata?.fileName}</Text>
                <Text type="supporting">
                  Hochgeladen am{" "}
                  <RenderIf when={data?.exists === true}>
                    <FormattedDate value={metadata?.uploadedAt ?? ""} />
                  </RenderIf>
                </Text>
              </div>
              <Button
                label="Löschen"
                icon={<Trash2 className="size-4" />}
                variant="destructive"
                size="sm"
                isDisabled={isDeleting}
                onClick={() => setIsDeleteDialogOpen(true)}
              />
            </div>
          </RenderIf>

          <RenderIf when={data?.exists === false}>
            <Text type="supporting" data-testid="privacy-policy-empty">
              Es wurde noch keine Datenschutzerklärung hochgeladen.
            </Text>
          </RenderIf>

          <div className="flex flex-wrap items-end gap-3">
            <FileInput
              label="Datei auswählen"
              value={selectedFile}
              onChange={(files) =>
                setSelectedFile(
                  Array.isArray(files) ? (files[0] ?? null) : files,
                )
              }
              accept={ACCEPTED_TYPES}
            />
            <Button
              label="Hochladen"
              icon={<Upload className="size-4" />}
              variant="primary"
              isDisabled={!selectedFile || isUploading}
              isLoading={isUploading}
              onClick={handleUpload}
            />
          </div>
        </div>
      </RenderIf>

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Datenschutzerklärung löschen"
        description="Soll die aktuelle Datenschutzerklärung wirklich gelöscht werden? Danach ist sie unter /privacy-policy nicht mehr erreichbar."
        actionLabel="Löschen"
        onAction={handleDelete}
        cancelLabel="Abbrechen"
        actionVariant="destructive"
      />
    </PageSubSection>
  )
}
