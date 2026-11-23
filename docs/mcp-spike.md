
# Spike: MCP clients signing in through Keycloak (#423)

Time-boxed desk research for #423, done before building the `/mcp` endpoint. It was **not**
verified against a running Keycloak or a real coding agent; the open questions at the end list
what the manual acceptance check has to confirm.

Target: Keycloak **26.4.0** (pinned in `infrastructure/local/docker-compose.yml`), realm `ofsm`,
clients following the MCP authorization spec (2025-06-18 and 2025-11-25), e.g. Claude Code and
OpenCode.

## Outcome

|           Question            |                                                                                     Decision                                                                                     |
|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Registration path             | **Anonymous Dynamic Client Registration** (RFC 7591) at `<issuer>/clients-registrations/openid-connect`, advertised as `registration_endpoint` in the realm metadata.            |
| Client ID Metadata Documents  | Not used. Keycloak 26.4 does not advertise `client_id_metadata_document_supported`, so MCP clients fall back to DCR. Revisit when Keycloak ships CIMD support.                   |
| Client type                   | Public clients (`token_endpoint_auth_method: none`), authorization code + PKCE (S256), loopback redirect URIs.                                                                   |
| Registration policies         | Anonymous policies in the realm export: trusted hosts `localhost`/`127.0.0.1` for redirect URIs, no check of the sending host, consent required, max 200 clients.                |
| Allowed scopes                | "Allowed Client Scopes" policy: realm default scopes plus `ofsm-mcp`. Clients that ask for other scopes at registration time are rejected.                                       |
| Audience                      | Client scope `ofsm-mcp` with an audience mapper (custom audience `ofsm`, access token only), in the realm's **default default client scopes**, so every new client gets it.      |
| Roles in the token            | The built-in `roles` scope puts realm roles into `realm_access.roles`. DCR clients get "full scope disabled", so `ofsm-mcp` carries **scope mappings** for the OFSM realm roles. |
| Resource server check         | OFSM accepts tokens from the configured issuer only when `aud` contains one of `app.auth.mcp.accepted-audiences` (default `ofsm`).                                               |
| Resource indicator (RFC 8707) | MCP clients send `resource=<base>/mcp`. Keycloak 26.4 does not implement resource indicators and is expected to ignore the parameter; the audience comes from the scope.         |

## Flow

1. The agent calls `POST /mcp` without a token and gets `401` with
   `WWW-Authenticate: Bearer resource_metadata="<base>/.well-known/oauth-protected-resource/mcp"`.
2. It reads the protected-resource metadata (RFC 9728): `resource` is `<base>/mcp`,
   `authorization_servers` is the realm issuer.
3. It reads the realm metadata (`<issuer>/.well-known/openid-configuration`, or the RFC 8414
   variants it tries first), registers itself anonymously (DCR) with a loopback redirect URI,
   and opens the browser for authorization code + PKCE.
4. Keycloak shows the login page and the consent screen (consent is required for anonymously
   registered clients). The access token carries `aud: ofsm` and `realm_access.roles`.
5. The agent calls `/mcp` with `Authorization: Bearer <access token>`; OFSM maps the roles with the
   same role mapper as the browser login.

## Realm changes (`infrastructure/local/keycloak/ofsm-realm.json`)

- `clientScopes`: the realm export now lists client scopes explicitly. Keycloak only creates its
  built-in scopes when the export has none, so the export also carries the built-ins OFSM relies on
  (`basic`, `profile`, `email`, `roles`, `web-origins`, `acr`) next to `ofsm-mcp`.
- `defaultDefaultClientScopes`: the built-ins plus `ofsm-mcp`.
- `scopeMappings`: `ofsm-mcp` maps `ofsm-admin`, `ofsm-kleiderwart` and `ofsm-user`.
- `components` → client registration policies (anonymous): Trusted Hosts (`localhost`,
  `127.0.0.1`, sending host not checked, client URIs must match), Consent Required, Full Scope
  Disabled, Max Clients (200), Allowed Protocol Mapper Types (Keycloak defaults), Allowed Client
  Scopes (`ofsm-mcp` plus default scopes). The authenticated policies keep the Keycloak defaults.
- The `ofsm` browser client lists its default client scopes explicitly and does not get `ofsm-mcp`.

## Open questions (verify manually)

1. Does Keycloak 26.4 still create its **default client registration policies** when the realm
   export contains `ClientRegistrationPolicy` components? If it does, the default "Trusted Hosts"
   policy (empty host list) blocks every registration; delete it in the admin console
   (Realm settings → Client registration) and fix the export.
2. Does the import really skip the built-in client scopes when `clientScopes` is present (as
   assumed), and do the hand-written built-ins produce the same ID token as before (browser login
   still shows name and roles)?
3. Do Claude Code and OpenCode register with `localhost` or `127.0.0.1` redirect URIs, and with
   which `scope` value? A scope outside the allowed list makes the "Allowed Client Scopes" policy
   reject the registration.
4. Does Keycloak ignore the `resource` parameter on the authorization and token requests, or does
   it reject it?
5. Which metadata URL does each client try first? Keycloak serves
   `<issuer>/.well-known/openid-configuration` and `<issuer>/.well-known/oauth-authorization-server`;
   clients that only try the RFC 8414 path-inserted form at the host root would fail.
6. Is `typ` in the access token header `JWT` (or absent), so Spring Security's default type
   validation passes?
7. Consent screen: is the "OpenFireStationManager" consent text shown for `ofsm-mcp`, and is
   consent remembered across agent restarts (a re-registration creates a new client and asks
   again)?
8. Registered clients accumulate (one per agent install, capped at 200). Is a cleanup needed?
