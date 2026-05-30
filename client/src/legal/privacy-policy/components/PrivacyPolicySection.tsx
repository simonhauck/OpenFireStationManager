import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { ExternalLink, Trash2, Upload } from "lucide-react"

import {
  deletePrivacyPolicyMutation,
  privacyPolicyQuery,
  uploadPrivacyPolicyMutation,
} from "#/legal/privacy-policy/service/privacyPolicyQueries"
import DeleteDialogComponent from "#/components/base/DeleteDialogComponent"
import ErrorState from "#/components/base/ErrorState"
import FormattedDate from "#/components/base/FormattedDate"
import LoadingIndicator from "#/components/base/LoadingIndicator"
import PageSubSection from "#/components/base/PageSubSection"
import RenderIf from "#/components/base/RenderIf"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"

const ACCEPTED_TYPES =
  ".pdf,.html,.htm,.txt,application/pdf,text/html,text/plain"

export default function PrivacyPolicySection() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { data, isLoading, isError } = useQuery(privacyPolicyQuery())

  const metadata = data?.exists ? data.metadata : null

  const { mutate: uploadDocument, isPending: isUploading } = useMutation(
    uploadPrivacyPolicyMutation(queryClient),
  )
  const { mutate: deleteDocument, isPending: isDeleting } = useMutation(
    deletePrivacyPolicyMutation(queryClient),
  )

  function resetFileInput() {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleUpload() {
    if (!selectedFile) {
      return
    }

    uploadDocument(selectedFile, {
      onSuccess: () => {
        toast.success("Datenschutzerklärung wurde hochgeladen.")
        resetFileInput()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  function handleDelete() {
    deleteDocument(undefined, {
      onSuccess: () => {
        toast.success("Datenschutzerklärung wurde gelöscht.")
        resetFileInput()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <PageSubSection
      title="Datenschutzerklärung"
      subtitle="Lade die öffentlich verfügbare Datenschutzerklärung hoch (PDF, HTML oder Text, max. 10 MB)."
      right={
        <Button asChild variant="outline" size="sm">
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            Datenschutzerklärung aufrufen
          </a>
        </Button>
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
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{metadata?.fileName}</p>
                <p className="text-muted-foreground">
                  Hochgeladen am{" "}
                  <RenderIf when={data?.exists === true}>
                    <FormattedDate value={metadata?.uploadedAt ?? ""} />
                  </RenderIf>
                </p>
              </div>
              <DeleteDialogComponent
                onDelete={handleDelete}
                headline="Datenschutzerklärung löschen"
                bodyText="Soll die aktuelle Datenschutzerklärung wirklich gelöscht werden? Danach ist sie unter /privacy-policy nicht mehr erreichbar."
              >
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 className="size-4" />
                  Löschen
                </Button>
              </DeleteDialogComponent>
            </div>
          </RenderIf>

          <RenderIf when={data?.exists === false}>
            <p
              data-testid="privacy-policy-empty"
              className="text-sm text-muted-foreground"
            >
              Es wurde noch keine Datenschutzerklärung hochgeladen.
            </p>
          </RenderIf>

          <div className="flex flex-wrap items-center gap-3">
            <Input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              className="max-w-sm"
              aria-label="Datei auswählen"
              onChange={(event) =>
                setSelectedFile(event.target.files?.[0] ?? null)
              }
            />
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              <Upload className="size-4" />
              Hochladen
            </Button>
          </div>
        </div>
      </RenderIf>
    </PageSubSection>
  )
}
