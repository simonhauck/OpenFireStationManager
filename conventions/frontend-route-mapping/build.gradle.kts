plugins {
    kotlin("jvm") version "2.3.20"
    `java-gradle-plugin`
}

group = "io.github.simonhauck"

version = "0.1.0"

repositories { mavenCentral() }

dependencies { implementation("com.squareup:kotlinpoet:2.3.0") }

gradlePlugin {
    plugins {
        create("frontendRouteMapping") {
            id = "io.github.simonhauck.frontend-route-mapping"
            implementationClass =
                "io.github.simonhauck.openfirestationmanager.frontendroutemapping.FrontendRouteMappingPlugin"
        }
    }
}
