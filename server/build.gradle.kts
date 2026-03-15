plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
}

group = "io.github.simonhauck"

version = "0.0.1-SNAPSHOT"

description = "The server component to manage a firefighting station"

java { toolchain { languageVersion = JavaLanguageVersion.of(24) } }

repositories { mavenCentral() }

dependencies {
    implementation(libs.spring.boot.starter.data.jdbc)
    implementation(libs.spring.boot.starter.security)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.spring.boot.starter.webmvc)
    implementation(libs.kotlin.reflect)

    implementation(libs.springdoc.openapi.webmvc.ui)
    implementation(libs.nimbus.jose.jwt)

    implementation(libs.jackson.module.kotlin)
    implementation(libs.kotlin.logging.jvm)

    testAndDevelopmentOnly(libs.spring.boot.docker.compose)

    runtimeOnly(libs.postgresql)

    testImplementation(libs.spring.boot.starter.data.jdbc.test)
    testImplementation(libs.spring.boot.starter.restclient)
    testImplementation(libs.spring.security.test)
    testImplementation(libs.spring.boot.starter.validation.test)
    testImplementation(libs.spring.boot.starter.webmvc.test)
    testImplementation(libs.testcontainers.junit.jupiter)
    testImplementation(libs.testcontainers.postgresql)
    testImplementation(libs.kotlin.test.junit5)
    testImplementation(libs.assertj.core)
    testRuntimeOnly(libs.junit.platform.launcher)
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict", "-Xannotation-default-target=param-property")
    }
}

tasks.withType<Test> { useJUnitPlatform() }
