import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import RenderIf from "#/components/base/RenderIf"
import { Button } from "#/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"
import { upsertImpressumMutation } from "#/legal/impressum/service/impressumQueries"
import type { ImpressumDto } from "#/legal/model/legal.ts"

type ImpressumDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues: ImpressumDto | null
}

export default function ImpressumDialog({
  open,
  onOpenChange,
  initialValues,
}: ImpressumDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(initialValues?.name ?? "")
  const [address, setAddress] = useState(initialValues?.address ?? "")
  const [contactEmail, setContactEmail] = useState(
    initialValues?.contactEmail ?? "",
  )
  const [phone, setPhone] = useState(initialValues?.phone ?? "")

  const { mutate: upsert, isPending: isSaving } = useMutation(
    upsertImpressumMutation(queryClient),
  )

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName(initialValues?.name ?? "")
      setAddress(initialValues?.address ?? "")
      setContactEmail(initialValues?.contactEmail ?? "")
      setPhone(initialValues?.phone ?? "")
    }
    onOpenChange(nextOpen)
  }

  function handleSave() {
    upsert(
      {
        name,
        address,
        contactEmail,
        phone: phone.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Impressum wurde gespeichert.")
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error.message)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <RenderIf when={initialValues !== null}>
              Impressum bearbeiten
            </RenderIf>
            <RenderIf when={initialValues === null}>
              Impressum erstellen
            </RenderIf>
          </DialogTitle>
        </DialogHeader>

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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name || !address || !contactEmail || isSaving}
          >
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
