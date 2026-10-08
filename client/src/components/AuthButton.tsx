import { Avatar } from "@astryxdesign/core/Avatar"
import { Button } from "@astryxdesign/core/Button"
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { LogOut } from "lucide-react"
import { logoutMutation, meQuery } from "#/api/auth.queries"

export default function AuthButton() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data, isError } = useQuery(meQuery())
  const isAuthenticated = data?.authenticated === true && !isError
  const user = data?.user

  const { mutate: logout } = useMutation(logoutMutation(queryClient))

  function handleLogout() {
    logout(undefined, {
      onSuccess: () => void navigate({ to: "/", replace: true }),
    })
  }

  if (!isAuthenticated) {
    return <Button label="Anmelden" variant="primary" size="sm" href="/login" />
  }

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ")
  const menuTitle = user?.username ? `${fullName} (${user.username})` : fullName

  return (
    <DropdownMenu
      alignment="end"
      hasChevron={false}
      renderTrigger={(triggerProps) => (
        <Avatar
          {...triggerProps}
          name={fullName}
          alt={`Benutzermenü für ${fullName}`}
          size={32}
          tooltip={false}
        />
      )}
      items={[
        {
          type: "section",
          title: menuTitle,
          items: [
            {
              label: "Abmelden",
              icon: <LogOut className="size-4" />,
              variant: "destructive",
              onClick: handleLogout,
            },
          ],
        },
      ]}
    />
  )
}
