import type { components } from "#/api/schema"

export type UserRole = components["schemas"]["UserAccount"]["roles"][number]

export const ROLE_OPTIONS: Array<{
  value: UserRole
  label: string
  description: string
}> = [
  {
    value: "USER",
    label: "USER",
    description: "Kann sich anmelden und freigegebene Bereiche nutzen.",
  },
  {
    value: "ADMIN",
    label: "ADMIN",
    description:
      "Kann Nutzer verwalten und administrative Einstellungen bearbeiten.",
  },
  {
    value: "KLEIDERWART",
    label: "KLEIDERWART",
    description: "Kann das Schutzklamotten modul administrieren",
  },
]

export function getRoleLabel(role: UserRole): string {
  return (
    ROLE_OPTIONS.find((roleOption) => roleOption.value === role)?.label ?? role
  )
}
