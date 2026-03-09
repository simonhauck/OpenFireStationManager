import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "../../users/UsersPage";

export const Route = createFileRoute("/admin/users")({
  component: Users,
});

function Users() {
  return <UsersPage />;
}
