package io.github.simonhauck.openfirestationmanager.security.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.auth")
data class AuthenticationProperties(val jwtSigningSecret: String, val cookieName: String)
