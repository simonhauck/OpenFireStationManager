import { Link } from "@tanstack/react-router"

import ErrorState from "#/components/base/ErrorState"
import { Button } from "#/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"

type ClothingTypeFormProps = {
  title: string
  description: string
  name: string
  onNameChange: (name: string) => void
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
  pendingLabel: string
  submitLabel: string
  errorMessage: string | null
}

export default function ClothingTypeForm({
  title,
  description,
  name,
  onNameChange,
  onSubmit,
  isPending,
  pendingLabel,
  submitLabel,
  errorMessage,
}: ClothingTypeFormProps) {
  return (
    <main className="page-wrap px-4 py-12">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Bezeichnung</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
              />
            </div>

            {errorMessage && <ErrorState message={errorMessage} />}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/klamottenmanagement/types">Abbrechen</Link>
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? pendingLabel : submitLabel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
