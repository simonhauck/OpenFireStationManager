package io.github.simonhauck.openfirestationmanager.security

import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.rememberme.JdbcTokenRepositoryImpl
import org.springframework.security.web.authentication.rememberme.PersistentTokenBasedRememberMeServices
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository
import org.springframework.security.web.csrf.CookieCsrfTokenRepository

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(AuthenticationProperties::class)
class SecurityConfiguration {
    @Bean
    fun securityFilterChain(
        http: HttpSecurity,
        rememberMeServices: PersistentTokenBasedRememberMeServices,
    ): SecurityFilterChain {
        return http
            .cors { cors -> cors.disable() }
            .csrf { csrf ->
                csrf
                    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                    .ignoringRequestMatchers(
                        "/api/auth/login",
                        "/api/public/setup/initial-admin",
                        "/api/admin/**",
                    )
            }
            .sessionManagement { session ->
                session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers(
                        "/api/public/**",
                        "/error",
                        "/api/auth/login",
                        "/api/auth/csrf",
                    )
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/auth/me")
                    .permitAll()
                    .anyRequest()
                    .authenticated()
            }
            .rememberMe { remember -> remember.rememberMeServices(rememberMeServices) }
            .build()
    }

    @Bean
    fun rememberMeServices(
        authenticationProperties: AuthenticationProperties,
        userDetailsService: UserDetailsService,
        persistentTokenRepository: PersistentTokenRepository,
    ): PersistentTokenBasedRememberMeServices {
        return PersistentTokenBasedRememberMeServices(
                authenticationProperties.key,
                userDetailsService,
                persistentTokenRepository,
            )
            .apply {
                setParameter("rememberMe")
                setCookieName("REMEMBER_ME")
                setAlwaysRemember(true)
            }
    }

    @Bean
    fun persistentTokenRepository(jdbcTemplate: JdbcTemplate): PersistentTokenRepository {
        return JdbcTokenRepositoryImpl().apply {
            setJdbcTemplate(jdbcTemplate)
            setCreateTableOnStartup(false)
        }
    }

    @Bean fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun authenticationManager(
        authenticationConfiguration: AuthenticationConfiguration
    ): AuthenticationManager {
        return authenticationConfiguration.authenticationManager
    }
}
