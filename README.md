
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

- **Manage accounts and roles** for everyone at the station.
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
| `ADMIN`       | Everything above, plus manage accounts and the legal pages                           |

---

## Running it

You need Docker. Everything else comes in the image, which is published for both `amd64` and
`arm64` — so a Raspberry Pi works as well as a server.

```bash
curl -O https://raw.githubusercontent.com/simonhauck/OpenFireStationManager/main/example/docker-compose.yml
docker compose up -d
```

The app is then at **http://localhost:13841**.

> The example compose file uses throwaway database credentials. Change them before putting this
> anywhere that matters.

### Create the first account

A fresh installation has no accounts, and there is no sign-up screen — the first administrator is
created once via the API, after which everyone else is added from inside the app:

```bash
curl -X POST http://localhost:13841/api/public/setup/initial-admin \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "admin",
    "password": "change-me",
    "firstName": "Max",
    "lastName": "Mustermann"
  }'
```

This works exactly once. Afterwards it refuses with `409 Conflict`, so it cannot be used to sneak in
a second administrator later.

Now sign in at http://localhost:13841 and add the rest of the station under **Nutzer Management**.

### On a tablet by the kit room door

The everyday screens are built for exactly this. See
[`infrastructure/raspberry-pi/README.md`](infrastructure/raspberry-pi/README.md) for the Raspberry Pi
touchscreen settings that make it behave like a kiosk.

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
