import { Link } from "@tanstack/react-router"

import RoleGuard from "#/components/base/RoleGuard"
import { Button } from "#/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card"

export default function ClothingItemsPage() {
  return (
    <RoleGuard allowedRoles={["KLEIDERWART"]}>
      <main className="page-wrap px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Kleidungsstuecke</CardTitle>
            <CardDescription>
              Diese Ansicht ist aktuell ein Platzhalter. Hier werden bald alle
              vorhandenen Kleidungsstuecke angezeigt.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Bis dahin kannst du Kleidungstypen verwalten und vorbereiten.
            </p>

            <Button asChild variant="outline">
              <Link to="/klamottenmanagement/types">Zu den Kleidungstypen</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </RoleGuard>
  )
}

