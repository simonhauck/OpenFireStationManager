package io.github.simonhauck.openfirestationmanager.usermanagement

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder

/**
 * Password hashing for the legacy `users` table. Nothing signs in with these passwords any more
 * (authentication is OpenID Connect only); this stays until local user management is removed.
 */
@Configuration
class UserPasswordConfiguration {
    @Bean fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()
}
