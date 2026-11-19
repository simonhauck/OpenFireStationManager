
# Role mapping

OFSM does not store users or roles. On every sign-in the server reads the roles of the user from
claims of the OpenID Connect provider and translates them into the OFSM roles `USER`, `KLEIDERWART`
and `ADMIN`. You configure two things in `application.yml` (or the equivalent environment
variables): **where** the provider puts the roles and **which provider role means which OFSM role**.

```yaml
app:
  auth:
    roles:
      claim-paths: [realm_access.roles, resource_access.ofsm.roles]
      mapping:
        ADMIN: [ofsm-admin]
        KLEIDERWART: [ofsm-kleiderwart, kleiderkammer]
        USER: [ofsm-user]
```

## Properties

|           Property           |          Default          |                                   Meaning                                    |
|------------------------------|---------------------------|------------------------------------------------------------------------------|
| `app.auth.roles.claim-paths` | `[realm_access.roles]`    | Claims that carry provider roles, as dot-separated paths. Must not be empty. |
| `app.auth.roles.mapping`     | absent (identity mapping) | OFSM role to the list of provider role names that grant it.                  |
| `app.auth.username-claim`    | `preferred_username`      | Claim used as the display and audit username. Falls back to `sub`.           |

Rules:

- **Claim paths** navigate into nested claim objects: `realm_access.roles` reads the `roles` entry of
  the `realm_access` object, `groups` reads a top-level claim. The roles of all paths are combined.
  A claim value may be an array of strings or a single string. A path that does not exist in the
  token is ignored, so listing a path that some users do not have is harmless. Claim names that
  themselves contain a dot are not supported.
- **Mapping direction** is OFSM role to provider roles. Keys must be `ADMIN`, `KLEIDERWART` or
  `USER`. Several provider roles can grant the same OFSM role, and one provider role can be
  listed under several OFSM roles.
- **Matching is exact and case-sensitive.** `Ofsm-Admin` does not match `ofsm-admin`. Provider roles
  that are not listed (for example `offline_access`) are ignored.
- **Without `mapping`**, each OFSM role maps to the provider role with the same name (`USER`,
  `KLEIDERWART`, `ADMIN`). **With `mapping`**, only the listed entries apply: an OFSM role that is
  not listed is never granted, and the identity mapping is off.
- **`ADMIN` implies every role.** A user mapped to `ADMIN` also holds `KLEIDERWART` and `USER`.
- A user who signs in but ends up with no OFSM role has no access to the API.
- Roles are read at sign-in. A change at the provider applies at the user's next sign-in.
- **The application refuses to start** with a message naming the problem if a mapping key is not an
  OFSM role (for example `KLEIDERWAERT`) or if `claim-paths` is empty or contains a malformed path.

The local development setup uses the realm roles `ofsm-admin`, `ofsm-kleiderwart` and `ofsm-user`
of the Keycloak realm in `infrastructure/local/`, so it runs with a non-identity mapping. Each
property can also be set through an environment variable, for example
`APP_AUTH_ROLES_CLAIMPATHS_0=groups` and `APP_AUTH_ROLES_MAPPING_KLEIDERWART_0=kleiderkammer`.

## Claims come from the ID token and UserInfo

For the browser login OFSM reads the claims of the **ID token merged with the UserInfo response**.
The access token is not inspected. Keycloak does not put roles or groups into either of them by
default, so each source below needs a mapper that has **Add to ID token** and/or **Add to userinfo**
enabled. If a role is missing after login, this is the first thing to check.

Configure the mappers in Keycloak under **Clients > ofsm > Client scopes > ofsm-dedicated > Add
mapper > By configuration** (or in a shared client scope that the client uses).

## Keycloak examples

### Realm roles

Create realm roles (for example `ofsm-admin`, `ofsm-kleiderwart`, `ofsm-user`) and assign them to
users or groups. Add a **User Realm Role** mapper:

|     Setting      |        Value         |
|------------------|----------------------|
| Multivalued      | On                   |
| Token Claim Name | `realm_access.roles` |
| Claim JSON Type  | String               |
| Add to ID token  | On                   |
| Add to userinfo  | On                   |

```yaml
app:
  auth:
    roles:
      claim-paths: [realm_access.roles]
      mapping:
        ADMIN: [ofsm-admin]
        KLEIDERWART: [ofsm-kleiderwart]
        USER: [ofsm-user]
```

Keycloak treats the dots in the claim name as nesting, which produces
`{"realm_access": {"roles": [...]}}` as OFSM expects. The access token of a standard Keycloak realm
already contains this claim, but the ID token and UserInfo do not until the mapper is added.

### Client roles

Create the roles on a Keycloak client (for example the client `ofsm`) and assign them. Add a **User
Client Role** mapper:

|     Setting      |             Value              |
|------------------|--------------------------------|
| Client ID        | `ofsm` (the client with roles) |
| Multivalued      | On                             |
| Token Claim Name | `resource_access.ofsm.roles`   |
| Claim JSON Type  | String                         |
| Add to ID token  | On                             |
| Add to userinfo  | On                             |

```yaml
app:
  auth:
    roles:
      claim-paths: [resource_access.ofsm.roles]
      mapping:
        ADMIN: [admin]
        KLEIDERWART: [kleiderwart]
        USER: [user]
```

The client id is part of the path, so roles of several clients can be combined by listing several
paths. If the client id contains a dot, use a client id without one, because dotted names cannot be
addressed.

### Groups

If your realm already organises people in groups, map the groups directly. Add a **Group
Membership** mapper:

|     Setting      |  Value   |
|------------------|----------|
| Token Claim Name | `groups` |
| Full group path  | On       |
| Add to ID token  | On       |
| Add to userinfo  | On       |

With **Full group path** on, the claim contains paths with a leading slash, such as
`/feuerwehr/kleiderkammer`, and subgroups appear as `/parent/child`. Use exactly these strings in the
mapping (quote them in YAML if in doubt). With it off, only the bare group name is sent and the
mapping must use that instead.

```yaml
app:
  auth:
    roles:
      claim-paths: [groups]
      mapping:
        ADMIN: [/feuerwehr/wehrfuehrung]
        KLEIDERWART: [/feuerwehr/kleiderkammer, /feuerwehr/geraetewart]
        USER: [/feuerwehr/aktive]
```

Group membership is not inherited by the claim: a member of `/feuerwehr/kleiderkammer` carries that
path only, not its parent `/feuerwehr`.

### Combining sources

Realm roles, client roles and groups can be used side by side. List every path and put the provider
names of all sources into the mapping:

```yaml
app:
  auth:
    roles:
      claim-paths: [realm_access.roles, resource_access.ofsm.roles, groups]
      mapping:
        ADMIN: [ofsm-admin]
        KLEIDERWART: [ofsm-kleiderwart, /feuerwehr/kleiderkammer]
        USER: [ofsm-user]
```

## Other providers

Any provider that puts a string or array claim into the ID token or UserInfo works. Set
`claim-paths` to that claim, for example `roles` (Microsoft Entra ID app roles) or `groups`.

## Troubleshooting

- **User signs in but sees no access:** the claim is not in the ID token or UserInfo (mapper missing
  or "Add to ID token" off), the path in `claim-paths` does not match the claim, or the role name in
  `mapping` differs in case or spelling from the provider's.
- **Startup fails with `app.auth.roles.mapping contains the unknown OFSM role ...`:** a mapping key
  is not one of `ADMIN`, `KLEIDERWART`, `USER`.
- **Startup fails with `app.auth.roles.claim-paths must contain at least one claim path`:** the list
  is empty.
