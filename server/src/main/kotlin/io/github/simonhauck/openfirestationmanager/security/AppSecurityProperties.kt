package io.github.simonhauck.openfirestationmanager.security

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.auth")
data class AuthenticationProperties(
    val jwtSigningSecret: String,

    // TODO 08.03.26 - Simon.Hauck Remvove this properties
    val key: String,
)
