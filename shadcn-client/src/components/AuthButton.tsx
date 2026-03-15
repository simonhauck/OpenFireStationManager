import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { LogOut } from "lucide-react"

import { logoutMutation, meQuery } from "#/api/auth.queries"
import { Button } from "#/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu"

export default function AuthButton() {
  const queryClient = useQueryClient()
  const { data, isError } = useQuery(meQuery())
  const isAuthenticated = data?.authenticated === true && !isError
  const user = data?.user

  const { mutate: logout } = useMutation(logoutMutation(queryClient))

  if (!isAuthenticated) {
    return (
      <Button asChild size="sm">
        <Link to="/login">Anmelden</Link>
      </Button>
    )
  }

  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?"
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground ring-offset-background transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`Benutzermenü für ${fullName}`}
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span>{fullName}</span>
          {user?.username && (
            <span className="text-xs font-normal text-muted-foreground">
              {user.username}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => logout()}>
          <LogOut />
          Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
