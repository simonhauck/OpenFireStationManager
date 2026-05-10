import java.util.Properties

plugins {
    alias(libs.plugins.spotless)
    id("io.github.simonhauck.release") version "1.5.1"
}

repositories { mavenCentral() }

release {
    versionPropertyFile.set(layout.projectDirectory.file("gradle.properties"))
    releaseCommitAddFiles.set(
        listOf(file("gradle.properties"), file("infrastructure/ofsm-prod/compose.yml"))
    )
    postReleaseCommitAddFiles.set(listOf(file("gradle.properties")))
    disablePush.set(false)
}

val updateProdComposeImage =
    tasks.register("updateProdComposeImage") {
        dependsOn(tasks.named("writeReleaseVersion"))
        notCompatibleWithConfigurationCache("Uses direct file IO for release compose pinning.")
        doLast {
            val props = Properties()
            file("gradle.properties").inputStream().use { props.load(it) }
            val version = props.getProperty("version")
            val composeFile = file("infrastructure/ofsm-prod/compose.yml")
            val updated =
                composeFile
                    .readText()
                    .replace(
                        Regex("ghcr\\.io/simonhauck/open-fire-station-manager:[^\\s]+"),
                        "ghcr.io/simonhauck/open-fire-station-manager:$version",
                    )
            composeFile.writeText(updated)
        }
    }

tasks.named("commitReleaseVersion") { dependsOn(updateProdComposeImage) }

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
