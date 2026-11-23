import org.gradle.api.tasks.PathSensitivity

plugins { base }

val isWindows = System.getProperty("os.name").lowercase().contains("windows")
val npm = if (isWindows) "npm.cmd" else "npm"

val clientDirectory = layout.projectDirectory
val apiGenerationDirectory = clientDirectory.dir("tools/api-generation")
val frontendOutputDirectory = layout.buildDirectory.dir("frontend")

val installDependencies = tasks.register<Exec>("installDependencies") {
    group = "build"
    description = "Installs client dependencies with npm ci."

    workingDir = clientDirectory.asFile
    commandLine(npm, "ci")

    inputs
        .files(
            clientDirectory.file("package.json"),
            clientDirectory.file("package-lock.json"),
            apiGenerationDirectory.file("package.json"),
            apiGenerationDirectory.file("package-lock.json"),
        )
        .withPathSensitivity(PathSensitivity.RELATIVE)
    outputs.dir(clientDirectory.dir("node_modules"))
    outputs.dir(apiGenerationDirectory.dir("node_modules"))
}

val generateRoutes = tasks.register<Exec>("generateRoutes") {
    group = "build"
    description = "Generates the TanStack Router route tree."

    dependsOn(installDependencies)
    workingDir = clientDirectory.asFile
    commandLine(npm, "run", "generate:routes")

    inputs.dir(clientDirectory.dir("src/routes")).withPathSensitivity(PathSensitivity.RELATIVE)
    outputs.file(clientDirectory.file("src/routeTree.gen.ts"))
}

val generateApi = tasks.register<Exec>("generateApi") {
    group = "build"
    description = "Generates the typed API bindings from the committed OpenAPI contract."

    dependsOn(installDependencies)
    workingDir = clientDirectory.asFile
    commandLine(npm, "run", "generate:api")

    inputs
        .file(rootProject.layout.projectDirectory.file("server/src/main/resources/open-api-contract.json"))
        .withPathSensitivity(PathSensitivity.RELATIVE)
    outputs.file(clientDirectory.file("src/api/schema.ts"))
}

val buildTheme = tasks.register<Exec>("buildTheme") {
    group = "build"
    description = "Builds the Astryx theme."

    dependsOn(installDependencies)
    workingDir = clientDirectory.asFile
    commandLine(npm, "run", "theme:build")

    inputs.file(clientDirectory.file("src/theme/appTheme.ts")).withPathSensitivity(PathSensitivity.RELATIVE)
    outputs.dir(clientDirectory.dir("src/theme/built"))
}

val prepareEnv = tasks.register("prepareEnv") {
    group = "build"
    description = "Installs dependencies and regenerates the client route tree, API bindings, and theme."

    dependsOn(installDependencies, generateRoutes, generateApi, buildTheme)
}

val test = tasks.register<Exec>("test") {
    group = "verification"
    description = "Runs the client unit tests with Vitest."

    dependsOn(prepareEnv)
    workingDir = clientDirectory.asFile
    commandLine(npm, "run", "test")
}

val typeCheck = tasks.register<Exec>("typeCheck") {
    group = "verification"
    description = "Type-checks the client with TypeScript."

    dependsOn(prepareEnv)
    workingDir = clientDirectory.asFile
    commandLine(npm, "run", "build:check")
}

val formatCheck = tasks.register<Exec>("formatCheck") {
    group = "verification"
    description = "Checks client formatting and linting with Biome."

    dependsOn(prepareEnv)
    workingDir = clientDirectory.asFile
    commandLine(npm, "run", "format:check")
}

val formatFix = tasks.register<Exec>("formatFix") {
    group = "formatting"
    description = "Formats and lint-fixes the client with Biome."

    dependsOn(installDependencies)
    workingDir = clientDirectory.asFile
    commandLine(npm, "run", "format:fix")
}

val buildFrontend = tasks.register<Exec>("buildFrontend") {
    group = "build"
    description = "Builds the production frontend bundle into the client build directory."

    dependsOn(prepareEnv, "check")
    workingDir = clientDirectory.asFile
    commandLine(npm, "run", "build")

    inputs
        .files(fileTree("src") { exclude("routeTree.gen.ts") })
        .withPathSensitivity(PathSensitivity.RELATIVE)
    inputs.dir(clientDirectory.dir("public")).withPathSensitivity(PathSensitivity.RELATIVE)
    inputs
        .files(
            clientDirectory.file("index.html"),
            clientDirectory.file("vite.config.ts"),
            clientDirectory.file("tsconfig.json"),
            clientDirectory.file("package.json"),
            clientDirectory.file("package-lock.json"),
        )
        .withPathSensitivity(PathSensitivity.RELATIVE)
    outputs.dir(frontendOutputDirectory)
}

tasks.named("check") { dependsOn(prepareEnv, test, typeCheck, formatCheck) }

tasks.named("assemble") {
    if (project.hasProperty("prod")) {
        dependsOn(buildFrontend)
    }
}
