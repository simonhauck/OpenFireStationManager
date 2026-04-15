import type { ReactNode } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog"

interface DeleteDialogComponentProps {
  onDelete: () => void
  headline: string
  bodyText: string
  children: ReactNode
  confirmText?: string
  cancelText?: string
}

export default function DeleteDialogComponent({
  onDelete,
  headline,
  bodyText,
  children,
  confirmText = "Loeschen",
  cancelText = "Abbrechen",
}: DeleteDialogComponentProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{headline}</AlertDialogTitle>
          <AlertDialogDescription>{bodyText}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
