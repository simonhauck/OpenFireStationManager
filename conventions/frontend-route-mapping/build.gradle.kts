plugins {
    kotlin("jvm") version "2.3.10"
    `java-gradle-plugin`
}

group = "io.github.simonhauck"

version = "0.1.0"

repositories { mavenCentral() }

dependencies { implementation("com.squareup:kotlinpoet:2.2.0") }

gradlePlugin {
    plugins {
        create("frontendRouteMapping") {
            id = "io.github.simonhauck.frontend-route-mapping"
            implementationClass =
                "io.github.simonhauck.openfirestationmanager.frontendroutemapping.FrontendRouteMappingPlugin"
        }
    }
}
