
# ADR-0002: The client is a Gradle module and its bundle is built only with `-Pprod`

**Status:** Accepted
**Date:** 2026-11-02

## Context

The repository has two components, but only the server was a Gradle project. Building the deployable
application required remembering an npm-before-Gradle sequence: install the client dependencies, run
the Vite production build into `server/src/main/resources/static/`, then invoke Gradle to package the
server. CI repeated the same sequence as separate npm steps, and the publish workflow assumed the
frontend had already been built.

That split had several failure modes. A backend-only Gradle build could silently package a stale
frontend. The frontend wrote generated assets into the server's source tree, so cleaning the client
did not clean its own output. Dependency drift was invisible until a check failed. Contributors had
to know which operations belonged to npm and which to Gradle.

At the same time, building the frontend on every backend build would make the common development
loop slower. The production bundle is only needed for a deployable artifact.

## Decision

- The client is a first-class Gradle subproject using the standard `base` lifecycle. `build` depends
  on `check` and `assemble`, and the client exposes a real `test` task so the root `test` task runs
  both unit-test suites.
- Gradle wraps the existing npm commands rather than replacing them. Node and npm are expected on
  `PATH`; no Node toolchain plugin or downloaded distribution is introduced.
- `./gradlew prepareEnv` is the single preparation command. It delegates to the client and runs
  `npm ci`, TanStack route generation, OpenAPI binding generation, and the Astryx theme build.
- `./gradlew check` always runs the client checks (Vitest, TypeScript, Biome) and prepares generated
  sources first. It never builds the Vite bundle. `check` refreshes generated files silently rather
  than failing on a stale committed artifact.
- The production bundle is opt-in: `./gradlew build -Pprod` makes `assemble` depend on the Vite
  build. Without `-Pprod`, `build` does not produce a frontend bundle.
- Vite writes to `client/build/frontend/`, which the client owns and cleans. The server includes that
  directory as static resources when it exists. Under `-Pprod`, server resource processing and the
  generated frontend route mapping depend on the client production build.
- The Vite production build is ordered after the client `check` when both are in the task graph, so
  the TanStack generator never races with the Vite plugin over `src/routeTree.gen.ts`.
- Root `spotlessApply` and `spotlessCheck` delegate to the client format tasks. Formatting fixes
  depend only on dependency installation, not on code generation.
- `jib` is not gated by `-Pprod`; CI passes `-Pprod` so published images always contain a fresh
  frontend.
- The dev server, Playwright, the preview server, and the Astryx CLI remain npm commands. They are
  interactive or long-running workflows, not build steps.
- CI uses the Gradle task graph for checks and publishing, with a dedicated
  `./gradlew :client:assemble -Pprod` verification step. The E2E job keeps its npm command.

## Consequences

- Backend-only builds and checks stay frontend-free and fast, while `check` and `test` cover both
  components by default.
- The deployable artifact can no longer be assembled from a stale frontend without explicitly
  passing `-Pprod`; a missing flag now means "no bundle", which is visible rather than silent.
- Generated client output has one owner. Cleaning `client/build/` removes the bundle, and the server
  packages it from there instead of reaching into the client source tree.
- Contributors need Node and npm on their `PATH` for client tasks. This is the same requirement as
  before; Gradle does not manage the Node version.
- The client build now depends on the Gradle daemon, and the server's production build depends on the
  client task graph. Cross-component failures surface in one command instead of a remembered order.
- `npm ci` runs through Gradle with the manifest and lockfile as inputs, so repeated builds skip the
  install when dependencies have not changed.

## Alternatives rejected

- **Keep two independent build surfaces:** preserves the stale-frontend failure mode and forces every
  contributor and CI job to remember the ordering.
- **Build the frontend on every `./gradlew build`:** makes backend development pay for a bundle it
  does not use, which is why the production build is gated behind `-Pprod`.
- **Move the client fully into Gradle-managed Node tooling:** adds a downloaded Node distribution and
  a second source of truth for the Node version. The repository already documents `.nvmrc` and CI
  setup, and contributors expect their own Node on `PATH`.
- **Wrap `dev`, `e2e`, `preview`, and the Astryx CLI in Gradle:** these are interactive workflows with
  their own watch modes and process lifecycles. Wrapping them would blur the purpose of the Gradle
  surface without removing the npm dependency.
- **Commit a generated-file diff guard:** `check` regenerates code, so a stale committed artifact is
  refreshed as part of the normal workflow rather than turning an ordinary build into a failure.
