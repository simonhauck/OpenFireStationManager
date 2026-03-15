plugins {
    alias(libs.plugins.kotlinJvm)
    alias(libs.plugins.kotlinSpring)
    alias(libs.plugins.springBoot)
    alias(libs.plugins.springDependencyManagement)
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

tasks.withType<Test> { useJUnitPlatform() }
