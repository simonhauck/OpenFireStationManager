rootProject.name = "conventions"

dependencyResolutionManagement {
    versionCatalogs { create("libs") { from(files("../gradle/libs.versions.toml")) } }
}

include(":frontend-route-mapping")

include(":release-compose-pinning")
