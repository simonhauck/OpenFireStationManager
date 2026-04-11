import { Link } from "@tanstack/react-router"

import type { ClothingType } from "#/clothing/model/clothingType"
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
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group"

type ClothingItemFormProps = {
  title: string
  description: string
  clothingTypes: ClothingType[]
  typeId: number | null
  onTypeIdChange: (typeId: number) => void
  size: string
  onSizeChange: (size: string) => void
  barcode: string
  onBarcodeChange: (barcode: string) => void
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
  pendingLabel: string
  submitLabel: string
  errorMessage: string | null
}

export default function ClothingItemForm({
  title,
  description,
  clothingTypes,
  typeId,
  onTypeIdChange,
  size,
  onSizeChange,
  barcode,
  onBarcodeChange,
  onSubmit,
  isPending,
  pendingLabel,
  submitLabel,
  errorMessage,
}: ClothingItemFormProps) {
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
              <Label>Kleidungstyp</Label>
              {clothingTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Keine Kleidungstypen vorhanden.
                </p>
              ) : (
                <RadioGroup
                  value={typeId !== null ? String(typeId) : undefined}
                  onValueChange={(val) => onTypeIdChange(Number(val))}
                  className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                >
                  {clothingTypes.map((type) => (
                    <div key={type.id} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={String(type.id)}
                        id={`type-${type.id}`}
                      />
                      <Label htmlFor={`type-${type.id}`}>{type.name}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="size">Groesse</Label>
              <Input
                id="size"
                required
                value={size}
                onChange={(e) => onSizeChange(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="barcode">Barcode (optional)</Label>
              <Input
                id="barcode"
                value={barcode}
                onChange={(e) => onBarcodeChange(e.target.value)}
              />
            </div>

            {errorMessage && <ErrorState message={errorMessage} />}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="outline" asChild>
                <Link to="/clothing-management/items">Abbrechen</Link>
              </Button>
              <Button type="submit" disabled={isPending || typeId === null}>
                {isPending ? pendingLabel : submitLabel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
