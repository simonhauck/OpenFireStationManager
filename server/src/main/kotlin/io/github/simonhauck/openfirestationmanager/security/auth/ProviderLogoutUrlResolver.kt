package io.github.simonhauck.openfirestationmanager.security.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.Authentication
import org.springframework.security.oauth2.client.oidc.web.logout.OidcClientInitiatedLogoutSuccessHandler
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository

/**
 * Resolves where the browser goes after logout: the provider's `end_session_endpoint`
 * (RP-initiated logout) with the application root as `post_logout_redirect_uri`, or the
 * application root itself when the caller was not signed in through the provider.
 */
class ProviderLogoutUrlResolver(clientRegistrationRepository: ClientRegistrationRepository) :
    OidcClientInitiatedLogoutSuccessHandler(clientRegistrationRepository) {

    init {
        setPostLogoutRedirectUri("{baseUrl}/")
        setDefaultTargetUrl("/")
    }

    fun resolve(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication?,
    ): String = determineTargetUrl(request, response, authentication)
}
