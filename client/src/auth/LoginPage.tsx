import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { loginMutation, meQueryKey } from "../gen/@tanstack/react-query.gen";

const getLoginErrorMessage = (error: unknown) => {
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const potentialMessage = (error as { message?: unknown }).message;
    if (typeof potentialMessage === "string" && potentialMessage.trim().length > 0) {
      return potentialMessage;
    }
  }

  return "Anmeldung fehlgeschlagen.";
};

const inputClasses = "input input-bordered w-full font-sans";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const login = useMutation({
    ...loginMutation({ credentials: "include" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meQueryKey() });
      await navigate({ to: "/" });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login.mutate({
      body: {
        username,
        password,
        rememberMe,
      },
    });
  };

  const errorMessage = login.isError ? getLoginErrorMessage(login.error) : null;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-base-200 px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="card border border-base-300 bg-base-100 shadow-xl">
          <div className="card-body gap-5">
            <div>
              <h1 className="card-title text-2xl">Anmelden</h1>
              <p className="text-base-content/70">
                Melde dich an, um deine Feuerwehrdaten zu verwalten.
              </p>
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="form-control">
                <span className="label-text mb-1 font-medium">Benutzername</span>
                <input
                  type="text"
                  className={inputClasses}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-1 font-medium">Passwort</span>
                <input
                  type="password"
                  className={inputClasses}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>

              <label className="label cursor-pointer justify-start gap-3 rounded-box border border-base-300 px-3 py-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span className="label-text">Auf diesem Geraet angemeldet bleiben</span>
              </label>

              {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

              <button type="submit" className="btn btn-primary" disabled={login.isPending}>
                {login.isPending ? "Anmeldung laeuft..." : "Anmelden"}
              </button>
            </form>

            <div className="text-sm text-base-content/70">
              Hilfe noetig?{" "}
              <Link to="/" className="link link-hover link-primary">
                Zur Startseite
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
