import { Avatar } from "@astryxdesign/core/Avatar"
import { Button } from "@astryxdesign/core/Button"
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu"
import { useQuery } from "@tanstack/react-query"
import { useLocation } from "@tanstack/react-router"
import { LogOut } from "lucide-react"
import { useRef } from "react"
import { meQuery } from "#/api/auth.queries"
import { loginUrl, LOGOUT_ENDPOINT } from "#/api/auth.utils"

export default function AuthButton() {
  const { data, isError } = useQuery(meQuery())
  const location = useLocation()
  const logoutForm = useRef<HTMLFormElement>(null)
  const isAuthenticated = data?.authenticated === true && !isError
  const user = data?.user

  // Logout is a top-level form POST, not a fetch call: the server answers with a redirect to the
  // provider's logout page, which a fetch cannot follow across origins.
  function handleLogout() {
    logoutForm.current?.submit()
  }

  if (!isAuthenticated) {
    // Return to the current page after signing in, unless that is the public start page.
    const returnTo = location.pathname === "/" ? "/dashboard" : location.href
    return (
      <Button
        label="Anmelden"
        variant="primary"
        size="sm"
        href={loginUrl(returnTo)}
      />
    )
  }

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ")
  const menuTitle = user?.username ? `${fullName} (${user.username})` : fullName

  return (
    <>
      <form
        ref={logoutForm}
        method="post"
        action={LOGOUT_ENDPOINT}
        className="hidden"
        aria-hidden="true"
      />
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
    </>
  )
}
