import { DropdownMenu } from "@astryxdesign/core/DropdownMenu"
import { useNavigate } from "@tanstack/react-router"
import { Plus } from "lucide-react"

type CreateWithImportButtonProps = {
  label: string
  createTo: string
  importTo: string
}

export default function CreateWithImportButton({
  label,
  createTo,
  importTo,
}: CreateWithImportButtonProps) {
  const navigate = useNavigate()

  return (
    <DropdownMenu
      button={{
        label,
        icon: <Plus className="size-4" />,
        variant: "primary",
      }}
      alignment="end"
      items={[
        {
          label: "Einzeln erstellen",
          onClick: () => void navigate({ to: createTo }),
        },
        {
          label: "Massenimport",
          onClick: () => void navigate({ to: importTo }),
        },
      ]}
    />
  )
}
