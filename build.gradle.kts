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

    json {
        target("**/*.json")
        targetExclude("client/**", "server/**", "conventions", "build/**", ".gradle/**")
        prettier()
    }

    yaml {
        target("**/*.yml", "**/*.yaml")
        targetExclude("client/**", "server/**", "conventions", "build/**", ".gradle/**")
        prettier()
    }
}
