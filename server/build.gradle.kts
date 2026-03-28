plugins {
    alias(libs.plugins.kotlinJvm)
    alias(libs.plugins.kotlinSpring)
    alias(libs.plugins.springBoot)
    alias(libs.plugins.springDependencyManagement)
    alias(libs.plugins.spotless)
}

group = "io.github.simonhauck"

version = "0.0.1-SNAPSHOT"

description = "The server component to manage a firefighting station"

java { toolchain { languageVersion = JavaLanguageVersion.of(24) } }

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
    implementation(libs.nimbusJoseJwt)

    implementation(libs.jacksonModuleKotlin)
    implementation(libs.kotlinLoggingJvm)

    testAndDevelopmentOnly(libs.springBootDockerCompose)

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
        prettier().configFile(file("../.prettierrc.json"))
    }

    format("yaml") {
        target("src/**/*.yml", "src/**/*.yaml", "compose.yml")
        prettier().configFile(file("../.prettierrc.json"))
    }
}

tasks.withType<Test> { useJUnitPlatform() }
