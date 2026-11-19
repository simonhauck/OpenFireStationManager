package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames
import org.springframework.security.oauth2.core.oidc.OidcIdToken
import org.springframework.security.oauth2.core.oidc.OidcUserInfo
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.stereotype.Component

/**
 * Builds the principal of every OFSM session: a [DefaultOidcUser] whose authorities are the
 * effective OFSM roles as `ROLE_<NAME>` and whose name is the configured username claim.
 *
 * Both the OIDC login and the test-only session endpoint go through this factory, so `/me`,
 * `CurrentUserProvider` and the audit fields behave identically for both.
 */
@Component
class OfsmUserFactory(private val authProperties: AuthProperties) {

    private val roleMapper = RoleMapper(authProperties.roles.mapping)

    /** Re-creates a user loaded from the provider with the mapped OFSM roles. */
    fun fromProviderUser(providerUser: OidcUser): OidcUser =
        create(providerUser.idToken, providerUser.userInfo, roleMapper.map(providerUser.claims))

    /** Creates a user holding [roles] (before `ADMIN` expansion). */
    fun create(
        idToken: OidcIdToken,
        userInfo: OidcUserInfo?,
        roles: Collection<UserRole>,
    ): OidcUser {
        val authorities =
            RoleMapper.expand(roles).map { SimpleGrantedAuthority("$ROLE_PREFIX${it.name}") }
        val claims = idToken.claims + userInfo?.claims.orEmpty()
        val nameAttributeKey =
            if (claims[authProperties.usernameClaim] != null) authProperties.usernameClaim
            else IdTokenClaimNames.SUB
        return DefaultOidcUser(authorities, idToken, userInfo, nameAttributeKey)
    }

    companion object {
        const val ROLE_PREFIX = "ROLE_"
    }
}
