
# OpenFireStationManager

**Keep track of who has which turnout gear — without a clipboard.**

Volunteer fire stations own hundreds of pieces of protective clothing: jackets, trousers, helmets,
boots, gloves. Every one of them belongs to someone, or sits in a locker, or is at the laundry. Most
stations track this on paper, in a spreadsheet, or in someone's head — and then spend an evening
each year working out what actually went missing.

OpenFireStationManager replaces that with a web app the whole station can use. A member swaps a
dirty jacket for a clean one by scanning two barcodes at a tablet by the kit room door. The
quartermaster sees the current stock at a glance and runs a stock-take without a clipboard.

> **Status:** in active development, and already in real use. Today the platform covers
> **protective clothing management** end to end. The name is deliberately broader than the current
> scope — more of station life is intended to follow, but only clothing is built so far.

---

## What it does

### For everyone at the station

- **Take gear out and hand it back**, in one go. Swapping a dirty jacket for a clean one is a
  single transaction, not two separate errands.
- **Scan barcodes** to pick items. Typing and searching are there as a fallback, but the scanner is
  the fast path.
- **Return to the laundry or straight to the pool**, depending on whether the gear is dirty.
- Designed for a **wall-mounted tablet** — large tap targets, no small controls, no keyboard needed
  for the common flows.

### For the quartermaster (*Kleiderwart*)

- **Keep the catalogue** of clothing types, individual items, and storage locations — with bulk
  creation for when a box of twenty identical jackets arrives.
- **Move gear in bulk** between locations when a laundry batch comes back or a locker is cleared.
- **Run a stock-take** against any location: scan what is physically there, review exactly what is
  unexpectedly present and what is missing, then confirm. Nothing changes until you approve it, and
  you can correct the list before you do.
- **See stock at a glance** — totals by clothing type and size, and what is currently available in
  the pool and at the laundry.

### For administrators

- **Publish the legal pages** German sites need — *Impressum* and *Datenschutzerklärung* — from the
  admin settings, with no redeploy.

### Throughout

- Every movement is **logged**. Items moved together share a batch reference, so a bulk action can
  be traced as one event rather than a scatter of unrelated changes.
- **Installable as a PWA**, so a tablet can run it like a native app.

---

## Who can do what

Roles stack rather than compete — an administrator implicitly holds every role.

|     Role      |                                         Can                                          |
|---------------|--------------------------------------------------------------------------------------|
| `USER`        | Look up gear, take it out, and hand it back                                          |
| `KLEIDERWART` | Everything above, plus manage the catalogue, move stock in bulk, and run stock-takes |
| `ADMIN`       | Everything above, plus manage the legal pages                                        |

Roles are assigned at your OpenID Connect provider (for example Keycloak) and mapped to these
three in the server configuration, see [`docs/role-mapping.md`](docs/role-mapping.md).

---

## Running it

You need Docker. Everything else comes in the image, which is published for both `amd64` and
`arm64` — so a Raspberry Pi works as well as a server.

The example setup starts OpenFireStationManager, PostgreSQL and a Keycloak with a demo realm, so
the login works right away. Run it from a clone of the repository (Keycloak imports the realm file
from `infrastructure/local/keycloak/`):

```bash
git clone https://github.com/simonhauck/OpenFireStationManager.git
cd OpenFireStationManager/example
docker compose up -d
```

The app is then at **http://localhost:8080**. Sign in with one of the demo users (the password
equals the username): `admin` (ADMIN), `kleiderwart` (KLEIDERWART), `user` (USER), or `norole`,
who can sign in but has no access. Keycloak's admin console is at http://localhost:8180/admin
(`admin` / `admin`). Startup takes a little longer than before because the app waits for Keycloak
to become healthy.

> The example compose file uses throwaway database credentials, a demo realm with well-known
> passwords and a public client secret. Never expose it to the internet. For a real station, set up
> your own provider as described under *Authentication*.

---

## Authentication

OpenFireStationManager has no accounts of its own. Everyone signs in through **one** OpenID Connect
provider; this guide uses Keycloak. Users, passwords and roles are managed there. OFSM reads the
roles from the tokens at sign-in and maps them to `USER`, `KLEIDERWART` and `ADMIN`.

### Setting up Keycloak

1. **Realm and users.** Use an existing realm or create one, and create the users of your station.
2. **Roles.** Create realm roles (for example `ofsm-admin`, `ofsm-kleiderwart`, `ofsm-user`) and
   assign them to users. A user without any mapped role can sign in but has no access.
3. **Client.** Create an OpenID Connect client with *Client authentication* **on** (confidential)
   and the *Standard flow* enabled. Copy the client ID and the secret (tab *Credentials*).
4. **URLs.** Set the valid redirect URI to `https://<your-host>/login/oauth2/code/ofsm` (or
   `https://<your-host>/*`) and the valid post logout redirect URI to `https://<your-host>/*`.
   `<your-host>` is the public address under which users open OFSM.
5. **Roles in the token.** Keycloak does not put roles into the ID token or UserInfo by default.
   Add a mapper (*Clients > your client > Client scopes > dedicated scope > Add mapper*), for
   example *User Realm Role*, with **Add to ID token** and/or **Add to userinfo** enabled. The
   claim name `realm_access.roles` matches the default configuration. Groups and client roles
   work as well; see [`docs/role-mapping.md`](docs/role-mapping.md) for each variant.

### Configuration

The server is configured through environment variables:

|                Variable                |                                 Meaning                                 |
|----------------------------------------|-------------------------------------------------------------------------|
| `OIDC_ISSUER_URI`                      | Issuer URL, for Keycloak `https://<keycloak>/realms/<realm>`            |
| `OIDC_CLIENT_ID`                       | Client ID of the client created above                                   |
| `OIDC_CLIENT_SECRET`                   | Client secret of that client                                            |
| `APP_AUTH_ROLES_CLAIMPATHS_0`          | Claim path with the provider roles, default `realm_access.roles`        |
| `APP_AUTH_ROLES_MAPPING_ADMIN_0`       | Provider role that grants `ADMIN` (`_1`, `_2`, ... add further roles)   |
| `APP_AUTH_ROLES_MAPPING_KLEIDERWART_0` | Provider role that grants `KLEIDERWART`                                 |
| `APP_AUTH_ROLES_MAPPING_USER_0`        | Provider role that grants `USER`                                        |
| `SESSION_TIMEOUT`                      | Idle timeout of an OFSM session, default `12h`                          |
| `SESSION_CLEANUP_CRON`                 | Cron expression for removing expired sessions, default every 10 minutes |

Example for a station that uses realm roles named `Admin`, `Kleiderkammer` and `Mitglied`:

```bash
OIDC_ISSUER_URI=https://login.example.org/realms/feuerwehr
OIDC_CLIENT_ID=ofsm
OIDC_CLIENT_SECRET=...
APP_AUTH_ROLES_MAPPING_ADMIN_0=Admin
APP_AUTH_ROLES_MAPPING_KLEIDERWART_0=Kleiderkammer
APP_AUTH_ROLES_MAPPING_USER_0=Mitglied
```

Role names are matched exactly and case-sensitively. More mapping examples (client roles, groups,
several roles per OFSM role) are in [`docs/role-mapping.md`](docs/role-mapping.md). The files in
[`infrastructure/ofsm-prod`](infrastructure/ofsm-prod) show a complete compose deployment.

> **The app does not start while the provider is unreachable.** At startup the server fetches the
> provider's metadata from `OIDC_ISSUER_URI`. If Keycloak is down or the URL is wrong, the server
> logs a message and exits. When Keycloak runs next to OFSM, start it first and wait until it is
> healthy (the example compose file does this with `depends_on` and a health check). A provider
> outage later on only prevents new sign-ins; existing sessions keep working until they expire.

Upgrading an installation that still uses local accounts? Read
[`docs/upgrade-oidc.md`](docs/upgrade-oidc.md) first.

### On a tablet by the kit room door

The everyday screens are built for exactly this. See
[`infrastructure/raspberry-pi/README.md`](infrastructure/raspberry-pi/README.md) for the Raspberry Pi
touchscreen settings that make it behave like a kiosk.

#### Staying signed in on a tablet

An OFSM session ends after `SESSION_TIMEOUT` (12 hours) without activity. Sessions are stored in the
database, so they survive server restarts and updates. When an OFSM session has expired, the app
sends the browser to Keycloak. If the Keycloak session is still valid, Keycloak signs the user in
again without asking for a password and the tablet carries on after a short redirect.

To get a tablet that rarely asks for a password, make Keycloak's session **longer** than OFSM's idle
timeout (*Realm settings > Sessions*):

- **SSO Session Idle** and **SSO Session Max**: for example 30 days.
- Optionally enable **Remember me** on the login page (*Realm settings > Login*) and raise
  **SSO Session Idle Remember Me** and **SSO Session Max Remember Me**. Users who tick the box then
  stay signed in at Keycloak for that longer time.

When the Keycloak session itself expires, users simply sign in again. No offline tokens or refresh
tokens are used or needed.

---

## A note on language

The **user interface is in German**, because the stations using it are. The code, the API, and all
developer documentation are in English. If you would like to help make the interface translatable,
that is a genuinely useful contribution — see below.

---

## Contributing

Contributions are welcome, including bug reports and ideas from people who run a station rather than
write software.

The repository is a monorepo with two independently built halves:

- **`client/`** — React 19 + TypeScript (Vite, TanStack Router/Query, shadcn/ui)
- **`server/`** — Spring Boot 4 + Kotlin (Spring Data JDBC, PostgreSQL)

To get set up, you need Node.js, Java 25, and Docker. Run the backend and frontend in two terminals:

```bash
./gradlew :server:bootRun     # from the repository root
cd client && npm install && npm run dev
```

Then read [`AGENTS.md`](AGENTS.md) — it is the contributor guide, and it links to the detailed
conventions for each half of the codebase. It is written for both people and AI coding assistants.
