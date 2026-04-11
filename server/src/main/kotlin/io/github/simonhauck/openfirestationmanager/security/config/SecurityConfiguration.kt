package io.github.simonhauck.openfirestationmanager.security.config

import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
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
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices
import org.springframework.security.web.context.HttpSessionSecurityContextRepository
import org.springframework.security.web.context.SecurityContextRepository

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(RememberMeProperties::class)
class SecurityConfiguration {

    @Bean
    fun securityContextRepository(): SecurityContextRepository =
        HttpSessionSecurityContextRepository()

    @Bean
    fun securityFilterChain(
        http: HttpSecurity,
        securityContextRepository: SecurityContextRepository,
        rememberMeServices: TokenBasedRememberMeServices,
        userDetailsService: UserDetailsService,
    ): SecurityFilterChain {
        return http
            .csrf { it.disable() }
            .sessionManagement {
                it.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                it.sessionFixation().changeSessionId()
            }
            .rememberMe {
                it.rememberMeServices(rememberMeServices)
                it.userDetailsService(userDetailsService)
            }
            .authorizeHttpRequests {
                it.requestMatchers("/api/public/**").permitAll()
                it.requestMatchers("/api/**").authenticated()
                it.anyRequest().permitAll()
            }
            .securityContext { it.securityContextRepository(securityContextRepository) }
            .build()
    }

    @Bean
    fun rememberMeServices(
        userDetailsService: UserDetailsService,
        rememberMeProperties: RememberMeProperties,
    ): TokenBasedRememberMeServices {
        val rememberMeCookieName = rememberMeProperties.tokenName

        val tokenValiditySeconds = rememberMeProperties.tokenValidity.seconds
        require(tokenValiditySeconds in 1..Int.MAX_VALUE.toLong()) {
            "app.remember-me.token-validity must be between 1 second and ${Int.MAX_VALUE} seconds"
        }

        val rememberMeServices =
            TokenBasedRememberMeServices(rememberMeProperties.key, userDetailsService)
        rememberMeServices.setCookieName(rememberMeCookieName)
        rememberMeServices.setTokenValiditySeconds(tokenValiditySeconds.toInt())
        rememberMeServices.setAlwaysRemember(true)
        rememberMeServices.setUseSecureCookie(true)
        return rememberMeServices
    }

    @Bean fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun authenticationManager(
        authenticationConfiguration: AuthenticationConfiguration
    ): AuthenticationManager {
        return authenticationConfiguration.authenticationManager
    }
}
