import com.google.cloud.tools.jib.gradle.JibTask
import org.gradle.kotlin.dsl.withType

plugins {
    alias(libs.plugins.kotlinJvm)
    alias(libs.plugins.kotlinSpring)
    alias(libs.plugins.springBoot)
    alias(libs.plugins.springDependencyManagement)
    alias(libs.plugins.spotless)
    alias(libs.plugins.jib)
    alias(libs.plugins.testLoggerPlugin)
}

group = "io.github.simonhauck"

version = "0.0.1-SNAPSHOT"

description = "The server component to manage a firefighting station"

java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }

repositories { mavenCentral() }

dependencies {
    implementation(libs.springBootStarterDataJdbc)
    implementation(libs.springBootStarterSecurity)
    implementation(libs.springBootStarterValidation)
    implementation(libs.springBootStarterWebmvc)
    implementation(libs.kotlinReflect)

    // Workaround until openApi does implement jackson v3 support
    // https://github.com/swagger-api/swagger-core/issues/4991
    // https://github.com/swagger-api/swagger-core/pull/5031
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation(libs.springdocOpenapiWebmvcUi)

    implementation(libs.jacksonModuleKotlin)
    implementation(libs.kotlinLoggingJvm)

    runtimeOnly(libs.postgresql)

    testImplementation(libs.springBootStarterDataJdbcTest)
    testImplementation(libs.springBootStarterRestclient)
    testImplementation(libs.springSecurityTest)
    testImplementation(libs.springBootStarterValidationTest)
    testImplementation(libs.springBootStarterWebmvcTest)
    testImplementation(libs.testcontainersJunitJupiter)
    testImplementation(libs.testcontainersPostgresql)
    testImplementation(libs.kotlinTestJunit5)
    testImplementation(libs.assertjCore)
    testRuntimeOnly(libs.junitPlatformLauncher)
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict", "-Xannotation-default-target=param-property")
    }
}

spotless {
    kotlin {
        target("src/*/kotlin/**/*.kt")
        ktfmt().kotlinlangStyle()
    }

    kotlinGradle {
        target("*.gradle.kts")
        ktfmt().kotlinlangStyle()
    }

    format("json") {
        target("src/**/*.json")
        prettier()
    }

    format("yaml") {
        target("src/**/*.yml", "src/**/*.yaml")
        prettier()
    }
}

jib {
    from {
        platforms {
            platform {
                architecture = "amd64"
                os = "linux"
            }
            platform {
                architecture = "arm64"
                os = "linux"
            }
        }
    }

    to {
        image = "ghcr.io/simonhauck/open-fire-station-manager"
        tags = setOfNotNull("$version", "latest").filterNot { it.isBlank() }.toSet()
        auth {
            username = System.getenv("DOCKER_USERNAME")
            password = System.getenv("DOCKER_PASSWORD")
        }
    }

    container {
        labels =
            mapOf(
                "org.opencontainers.image.source" to
                    "https://github.com/simonhauck/OpenFireStationManager"
            )
    }
}

tasks.withType<JibTask> {
    notCompatibleWithConfigurationCache(
        "because https://github.com/GoogleContainerTools/jib/issues/3132"
    )
}

tasks.withType<Test> { useJUnitPlatform() }
