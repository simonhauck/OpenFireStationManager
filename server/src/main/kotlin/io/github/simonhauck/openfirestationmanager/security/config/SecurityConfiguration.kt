package io.github.simonhauck.openfirestationmanager.security.config

import io.github.simonhauck.openfirestationmanager.security.auth.AuthProperties
import io.github.simonhauck.openfirestationmanager.security.auth.LoginRedirect
import io.github.simonhauck.openfirestationmanager.security.auth.OfsmUserFactory
import io.github.simonhauck.openfirestationmanager.security.auth.ProviderLogoutUrlResolver
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizedClientRepository
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.security.web.DefaultRedirectStrategy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.AuthenticationSuccessHandler
import org.springframework.security.web.authentication.HttpStatusEntryPoint
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler
import org.springframework.security.web.context.HttpSessionSecurityContextRepository
import org.springframework.security.web.context.SecurityContextRepository

/**
 * Authentication is delegated to a single OpenID Connect provider (registration `ofsm`, see
 * `spring.security.oauth2.client.*`). The server is a confidential client: it runs the
 * authorization code flow with PKCE and keeps the result in the server-side session, so the
 * browser only ever holds the `OFSM_AUTH` session cookie.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(AuthProperties::class)
class SecurityConfiguration {

    @Bean
    fun securityContextRepository(): SecurityContextRepository =
        HttpSessionSecurityContextRepository()

    @Bean
    fun providerLogoutUrlResolver(
        clientRegistrationRepository: ClientRegistrationRepository,
    ): ProviderLogoutUrlResolver = ProviderLogoutUrlResolver(clientRegistrationRepository)

    @Bean
    fun securityFilterChain(
        http: HttpSecurity,
        securityContextRepository: SecurityContextRepository,
        clientRegistrationRepository: ClientRegistrationRepository,
        ofsmUserFactory: OfsmUserFactory,
    ): SecurityFilterChain {
        return http
            .csrf { it.disable() }
            .sessionManagement {
                it.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                it.sessionFixation().changeSessionId()
            }
            // The SPA never relies on a saved request; the return path travels through the login
            // entry point instead. Without this, every 401 would create a session.
            .requestCache { it.disable() }
            // Logout is the documented `POST /api/public/auth/logout` endpoint only.
            .logout { it.disable() }
            .oauth2Login {
                // A custom login page disables Spring's generated one; `/login` is the client
                // route that shows sign-in errors.
                it.loginPage("/login")
                // Keep the provider's tokens in the session only, so they disappear with it.
                it.authorizedClientRepository(HttpSessionOAuth2AuthorizedClientRepository())
                it.authorizationEndpoint { endpoint ->
                    endpoint.authorizationRequestResolver(
                        pkceAuthorizationRequestResolver(clientRegistrationRepository),
                    )
                }
                it.userInfoEndpoint { userInfo ->
                    userInfo.oidcUserService(ofsmOidcUserService(ofsmUserFactory))
                }
                it.successHandler(loginSuccessHandler())
                it.failureHandler(SimpleUrlAuthenticationFailureHandler(LOGIN_FAILURE_URL))
            }
            // API calls without a session get a plain 401; the redirect to the provider is always
            // a deliberate top-level navigation to the login entry point.
            .exceptionHandling {
                it.authenticationEntryPoint(HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            }
            .authorizeHttpRequests {
                it.requestMatchers("/privacy-policy").permitAll()
                it.requestMatchers("/api/public/**").permitAll()
                it.requestMatchers("/api/**").authenticated()
                it.anyRequest().permitAll()
            }
            .securityContext { it.securityContextRepository(securityContextRepository) }
            .build()
    }

    private fun pkceAuthorizationRequestResolver(
        clientRegistrationRepository: ClientRegistrationRepository,
    ): DefaultOAuth2AuthorizationRequestResolver {
        val resolver =
            DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository,
                OAuth2AuthorizationRequestRedirectFilter.DEFAULT_AUTHORIZATION_REQUEST_BASE_URI,
            )
        resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce())
        return resolver
    }

    /** Loads the user from the provider and replaces its authorities with the mapped roles. */
    private fun ofsmOidcUserService(
        ofsmUserFactory: OfsmUserFactory,
    ): OAuth2UserService<OidcUserRequest, OidcUser> {
        val delegate = OidcUserService()
        return OAuth2UserService { userRequest ->
            ofsmUserFactory.fromProviderUser(delegate.loadUser(userRequest))
        }
    }

    /** Sends the browser to the return path stored by the login entry point. */
    private fun loginSuccessHandler(): AuthenticationSuccessHandler {
        val redirectStrategy = DefaultRedirectStrategy()
        return AuthenticationSuccessHandler { request, response, _ ->
            val session = request.getSession(false)
            val storedTarget = session?.getAttribute(LoginRedirect.SESSION_ATTRIBUTE) as? String
            session?.removeAttribute(LoginRedirect.SESSION_ATTRIBUTE)
            redirectStrategy.sendRedirect(request, response, LoginRedirect.sanitize(storedTarget))
        }
    }

    companion object {
        const val LOGIN_FAILURE_URL = "/login?error"
    }
}
