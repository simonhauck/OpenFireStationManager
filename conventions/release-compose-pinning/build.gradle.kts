plugins {
    alias(libs.plugins.kotlinJvm)
    `java-gradle-plugin`
}

group = "io.github.simonhauck"

version = "0.1.0"

repositories { mavenCentral() }

gradlePlugin {
    plugins {
        create("releaseComposePinning") {
            id = "io.github.simonhauck.release-compose-pinning"
            implementationClass =
                "io.github.simonhauck.openfirestationmanager.releasecomposepinning.ReleaseComposePinningPlugin"
        }
    }
}
