pluginManagement {
    includeBuild("conventions")
    plugins {
        kotlin("plugin.spring") version "2.4.10"
    }
}

rootProject.name = "openfirestationmanager"

plugins {
    // Specify toolchains: https://github.com/gradle/foojay-toolchains
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

include("server")
