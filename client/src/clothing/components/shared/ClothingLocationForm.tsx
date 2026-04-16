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
import { Checkbox } from "#/components/ui/checkbox"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"

type ClothingLocationFormProps = {
  title: string
  description: string
  name: string
  onNameChange: (name: string) => void
  comment: string
  onCommentChange: (comment: string) => void
  onlyVisibleForKleiderwart: boolean
  onOnlyVisibleForKleiderwartChange: (value: boolean) => void
  shouldBeShownOnDashboard: boolean
  onShouldBeShownOnDashboardChange: (value: boolean) => void
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
  pendingLabel: string
  submitLabel: string
  errorMessage: string | null
}

export default function ClothingLocationForm({
  title,
  description,
  name,
  onNameChange,
  comment,
  onCommentChange,
  onlyVisibleForKleiderwart,
  onOnlyVisibleForKleiderwartChange,
  shouldBeShownOnDashboard,
  onShouldBeShownOnDashboardChange,
  onSubmit,
  isPending,
  pendingLabel,
  submitLabel,
  errorMessage,
}: ClothingLocationFormProps) {
  return (
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

          <div className="space-y-1.5">
            <Label htmlFor="comment">Kommentar</Label>
            <Input
              id="comment"
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="onlyVisibleForKleiderwart"
              checked={onlyVisibleForKleiderwart}
              onCheckedChange={(checked) =>
                onOnlyVisibleForKleiderwartChange(checked === true)
              }
            />
            <Label htmlFor="onlyVisibleForKleiderwart">
              Nur sichtbar fuer Kleiderwart
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="shouldBeShownOnDashboard"
              checked={shouldBeShownOnDashboard}
              onCheckedChange={(checked) =>
                onShouldBeShownOnDashboardChange(checked === true)
              }
            />
            <Label htmlFor="shouldBeShownOnDashboard">
              Auf Dashboard anzeigen
            </Label>
          </div>

          {errorMessage && <ErrorState message={errorMessage} />}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" asChild>
              <Link to="/clothing-management/locations">Abbrechen</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? pendingLabel : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
