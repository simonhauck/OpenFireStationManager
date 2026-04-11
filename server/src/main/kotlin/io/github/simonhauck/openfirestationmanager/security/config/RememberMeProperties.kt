package io.github.simonhauck.openfirestationmanager.security.config

import java.time.Duration
import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties("app.remember-me")
data class RememberMeProperties(
    val key: String,
    val tokenValidity: Duration = Duration.ofDays(30),
    val tokenName: String,
)
