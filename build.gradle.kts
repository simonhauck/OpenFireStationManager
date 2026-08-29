plugins {
    alias(libs.plugins.spotless)
    id("io.github.simonhauck.release") version "1.5.1"
    id("io.github.simonhauck.release-compose-pinning")
}

repositories { mavenCentral() }

allprojects { group = "io.github.simonhauck" }

release {
    versionPropertyFile.set(layout.projectDirectory.file("gradle.properties"))
    releaseCommitAddFiles.set(
        listOf(file("gradle.properties"), file("infrastructure/ofsm-prod/compose.yml"))
    )
    postReleaseCommitAddFiles.set(listOf(file("gradle.properties")))
    gitName = "Release Bot"
    gitEmail = "no-reply@github.com"
}

spotless {
    kotlinGradle {
        target("*.gradle.kts")
        ktfmt().kotlinlangStyle()
    }

    format("json") {
        target("**/*.json", "**/*.jsonc")
        targetExclude("client/**", "server/**", "conventions/**", "build/**", ".gradle/**")
        // renovate: datasource=npm depName=@biomejs/biome
        biome("2.5.11").configPath(rootProject.file("biome.json"))
    }

    flexmark {
        target("**/*.md")
        targetExclude(
            "**/build/**",
            "**/.gradle/**",
            "**/.terraform/**",
            "**/node_modules/**",
        )
        flexmark("0.64.8")
            .extensions(
                "Tables",
                "TaskList",
            )
            .formatterOptions(
                mapOf(
                    "FORMAT_FLAGS" to "7",
                    "MAX_TRAILING_BLANK_LINES" to "0",
                )
            )
    }
}
