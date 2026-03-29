# OpenFireStationManager

OpenFireStationManager is an open-source platform for managing firefighting stations.
This repository is a monorepo with a frontend and backend that run independently.

## What is inside

- `client/` - React 19 + TypeScript web app (Vite, TanStack Router/Query, shadcn/ui)
- `server/` - Spring Boot 4 + Kotlin API (Spring Data JDBC, PostgreSQL, OpenAPI)

## Prerequisites

- Node.js + npm (for `client/`)
- Java 25 (for `server/`)
- Docker (required for backend integration tests)

## Quick start

Run each component in its own terminal.

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

```bash
cd server
./gradlew bootRun
```

The frontend and backend are built/run separately; there is no root-level build orchestrator.

## Useful commands

### Client (`client/`)

```bash
npm run test
npm run lint
npm run build
```

### Server (`server/`)

```bash
./gradlew test
./gradlew build
```

## Learn more

- `client/README.md` - frontend details
- `client/AGENTS.md` - frontend commands and conventions
- `server/AGENTS.md` - backend commands and conventions
