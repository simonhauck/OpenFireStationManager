# Upgrade guide: sign-in through OpenID Connect

> **Breaking change.** OpenFireStationManager no longer has its own accounts. Sign-in goes through
> an OpenID Connect provider such as Keycloak. **Prepare the provider before you upgrade**, because
> the new version does not start without it and nobody can sign in until it is configured.

## What changes

- **Local logins stop working.** The username/password login, the setup of the first admin and the
  user management screens are gone. Existing passwords are not migrated.
- **The `users` table is dropped** by the database migration that ships with this release. Back up
  your database first if you want to keep a copy of the old accounts.
- **Roles come from the provider.** `USER`, `KLEIDERWART` and `ADMIN` are no longer stored in OFSM;
  they are read from the provider's tokens at every sign-in.
- **Remember me is gone.** The remember-me signing key setting is no longer used and can be deleted.
  Long-lived sign-in on tablets is configured in Keycloak instead (see the README).
- **Sessions are stored in the database.** Restarts and updates no longer sign users out.
- **The server does not start while the provider is unreachable.**

## Before you upgrade

1. **Choose or set up a Keycloak** that is reachable from the OFSM server and from the browsers of
   your users.
2. **Create the users** of your station in Keycloak. If you want the audit trail to stay
   continuous, use the same usernames as in the old OFSM (see below).
3. **Create roles and assign them** to the users, for example the realm roles `ofsm-admin`,
   `ofsm-kleiderwart` and `ofsm-user`. Make sure at least one person is an administrator.
4. **Create a confidential client** (*Client authentication* on, *Standard flow* on) and note its ID
   and secret. Set the valid redirect URI to `https://<your-host>/login/oauth2/code/ofsm` (or
   `https://<your-host>/*`) and the valid post logout redirect URI to `https://<your-host>/*`.
5. **Add a roles mapper** to the client with **Add to ID token** and/or **Add to userinfo**
   enabled, otherwise users sign in without roles. See [`role-mapping.md`](role-mapping.md).
6. **Set the environment variables** of the OFSM container and remove the old remember-me key variable:

|                Variable                |                          Required                           |
|----------------------------------------|-------------------------------------------------------------|
| `OIDC_ISSUER_URI`                      | yes, e.g. `https://login.example.org/realms/feuerwehr`      |
| `OIDC_CLIENT_ID`                       | yes                                                         |
| `OIDC_CLIENT_SECRET`                   | yes                                                         |
| `APP_AUTH_ROLES_CLAIMPATHS_0`          | only if the roles are not in `realm_access.roles`           |
| `APP_AUTH_ROLES_MAPPING_ADMIN_0`       | provider role for `ADMIN`, default `ofsm-admin`             |
| `APP_AUTH_ROLES_MAPPING_KLEIDERWART_0` | provider role for `KLEIDERWART`, default `ofsm-kleiderwart` |
| `APP_AUTH_ROLES_MAPPING_USER_0`        | provider role for `USER`, default `ofsm-user`               |

   Compose deployments based on `infrastructure/ofsm-prod` and `infrastructure/ofsm-dev` use the
   variables `OIDC_ISSUER_URI`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_ROLES_CLAIM_PATH`,
   `OIDC_ROLE_ADMIN`, `OIDC_ROLE_KLEIDERWART` and `OIDC_ROLE_USER` in their `.env` file.
7. **Optionally tune long-lived sign-in** for tablets in Keycloak (SSO Session Idle/Max, Remember
   me). See the README section "Staying signed in on a tablet".

## After you upgrade

- Open OFSM; you are redirected to Keycloak. Sign in as an administrator and check that the pages
  for your role are available.
- A user who can sign in but sees no data has no mapped role. Check the roles mapper and the
  mapping variables.
- The server log tells you if the provider is unreachable or the mapping is invalid; the server
  then refuses to start.

## Audit trail

The fields `createdBy` and `lastModifiedBy` keep the usernames that were written before. New
entries use the username claim of the provider (`preferred_username`, falling back to `sub`).
**If the usernames in Keycloak are the same as the old OFSM usernames, the audit trail continues
seamlessly.** If they differ, old entries keep the old names and are not linked to the new ones.
