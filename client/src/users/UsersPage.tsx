import { useQuery } from "@tanstack/react-query";
import { getAllUsersOptions, meOptions } from "../gen/@tanstack/react-query.gen";

const roleBadgeClass = "badge badge-outline badge-sm";

const formatFallback = (value: string | undefined) => {
  if (!value || value.trim().length === 0) {
    return "-";
  }

  return value;
};

export function UsersPage() {
  const { data: authData, isLoading: isAuthLoading } = useQuery(
    meOptions({ credentials: "include" })
  );

  const isAdmin = authData?.authenticated === true && authData.user?.roles?.includes("ADMIN");

  const {
    data: users,
    isLoading: isUsersLoading,
    isError,
    error,
  } = useQuery({
    ...getAllUsersOptions({ credentials: "include" }),
    enabled: isAdmin === true,
  });

  if (isAuthLoading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-base-200 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-base-200 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="alert alert-warning">
            <span>Kein Zugriff auf die Benutzerverwaltung.</span>
          </div>
        </div>
      </main>
    );
  }

  if (isUsersLoading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-base-200 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-base-200 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="alert alert-error">
            <span>Benutzer konnten nicht geladen werden: {error.message}</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-base-200 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Benutzerverwaltung</h1>
          <p className="text-base-content/70">Alle Benutzerkonten und ihre Rollen.</p>
        </div>

        <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow">
          <table className="table">
            <thead>
              <tr>
                <th>Benutzername</th>
                <th>Vorname</th>
                <th>Nachname</th>
                <th>Rollen</th>
              </tr>
            </thead>
            <tbody>
              {users?.length ? (
                users.map((user) => (
                  <tr key={`${user.id ?? "no-id"}-${user.username ?? "no-username"}`}>
                    <td>{formatFallback(user.username)}</td>
                    <td>{formatFallback(user.firstName)}</td>
                    <td>{formatFallback(user.lastName)}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.length ? (
                          user.roles.map((role) => (
                            <span className={roleBadgeClass} key={`${user.id ?? user.username}-${role}`}>
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-base-content/60">Keine Rolle</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-base-content/70">
                    Keine Benutzer vorhanden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
