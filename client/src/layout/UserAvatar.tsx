import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutMutation, meQueryKey } from "../gen/@tanstack/react-query.gen";

type UserAvatarProps = {
  username: string;
};

const getUserInitials = (username: string) => username.slice(0, 2).toUpperCase();

export function UserAvatar({ username }: UserAvatarProps) {
  const queryClient = useQueryClient();

  const logout = useMutation({
    ...logoutMutation({ credentials: "include" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meQueryKey() });
    },
  });

  return (
    <div className="dropdown dropdown-end">
      <button type="button" tabIndex={0} className="btn btn-ghost btn-circle">
        <div className="avatar avatar-placeholder" title={username}>
          <div className="bg-primary text-primary-content w-10 rounded-full">
            <span className="text-sm font-semibold">{getUserInitials(username)}</span>
          </div>
        </div>
      </button>

      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content mt-3 w-52 rounded-box border border-base-300 bg-base-100 p-2 shadow"
      >
        <li className="menu-title">
          <span>{username}</span>
        </li>
        <li>
          <button type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>
            {logout.isPending ? "Abmeldung laeuft..." : "Abmelden"}
          </button>
        </li>
      </ul>
    </div>
  );
}
