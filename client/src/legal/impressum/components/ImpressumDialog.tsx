import { Button } from "@astryxdesign/core/Button"
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog"
import { TextArea } from "@astryxdesign/core/TextArea"
import { TextInput } from "@astryxdesign/core/TextInput"
import { useToast } from "@astryxdesign/core/Toast"
import { VStack } from "@astryxdesign/core/VStack"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
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
  const showToast = useToast()
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
          showToast({ body: "Impressum wurde gespeichert.", type: "info" })
          onOpenChange(false)
        },
        onError: (error) => {
          showToast({
            body: error.message,
            type: "error",
            isAutoHide: true,
          })
        },
      },
    )
  }

  return (
    <Dialog
      isOpen={open}
      onOpenChange={handleOpenChange}
      width={512}
      purpose="form"
    >
      <VStack gap={4}>
        <DialogHeader
          title={
            initialValues !== null
              ? "Impressum bearbeiten"
              : "Impressum erstellen"
          }
          onOpenChange={handleOpenChange}
        />

        <TextInput
          label="Name"
          isRequired
          value={name}
          onChange={setName}
          placeholder="z. B. Freiwillige Feuerwehr Musterstadt"
        />
        <TextArea
          label="Adresse"
          isRequired
          value={address}
          onChange={setAddress}
          placeholder={"Musterstraße 1\n12345 Musterstadt"}
          rows={3}
        />
        <TextInput
          label="Kontakt-E-Mail"
          type="email"
          isRequired
          value={contactEmail}
          onChange={setContactEmail}
          placeholder="info@feuerwehr-musterstadt.de"
        />
        <TextInput
          label="Telefonnummer (optional)"
          value={phone}
          onChange={setPhone}
          placeholder="+49 123 456789"
        />

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            label="Abbrechen"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            isDisabled={isSaving}
          />
          <Button
            label="Speichern"
            variant="primary"
            onClick={handleSave}
            isDisabled={!name || !address || !contactEmail || isSaving}
            isLoading={isSaving}
          />
        </div>
      </VStack>
    </Dialog>
  )
}
