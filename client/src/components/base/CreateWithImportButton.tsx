import { useNavigate } from "@tanstack/react-router"
import { ChevronDown, Plus } from "lucide-react"

import { Button } from "#/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="size-4" />
          {label}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void navigate({ to: createTo })}>
          Einzeln erstellen
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void navigate({ to: importTo })}>
          Massenimport
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
