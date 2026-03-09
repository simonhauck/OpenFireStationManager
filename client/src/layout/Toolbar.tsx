import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { meOptions } from "../gen/@tanstack/react-query.gen";
import { UserAvatar } from "./UserAvatar";

export function Toolbar() {
  const { data, isLoading } = useQuery(meOptions({ credentials: "include" }));

  const isAuthenticated = data?.authenticated === true;
  const username = data?.user?.username;
  const isAdmin = data?.user?.roles?.includes("ADMIN") === true;

  return (
    <header className="navbar bg-base-200 px-4 shadow-sm">
      <div className="flex-1 gap-2">
        <Link to="/" className="btn btn-ghost text-lg normal-case">
          OpenFireStationManager
        </Link>
        <nav className="join">
          <Link to="/" className="btn btn-ghost join-item [&.active]:btn-active">
            Startseite
          </Link>
          <Link to="/about" className="btn btn-ghost join-item [&.active]:btn-active">
            Ueber uns
          </Link>
          {isAdmin && (
            <Link to="/admin/users" className="btn btn-ghost join-item [&.active]:btn-active">
              Benutzer
            </Link>
          )}
        </nav>
      </div>

      <div className="flex-none">
        {isLoading && <span className="loading loading-spinner loading-md" />}

        {!isLoading && isAuthenticated && username && (
          <UserAvatar username={username} />
        )}

        {!isLoading && !isAuthenticated && (
          <Link to="/login" className="btn btn-primary">
            Anmelden
          </Link>
        )}
      </div>
    </header>
  );
}
