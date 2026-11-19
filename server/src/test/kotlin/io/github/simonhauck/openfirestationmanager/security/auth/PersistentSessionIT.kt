package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.testing.TestSessionControllerCalls
import io.github.simonhauck.openfirestationmanager.testing.TestSessionRequest
import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import java.util.Base64
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.serializer.support.DeserializingConverter
import org.springframework.core.serializer.support.SerializingConverter
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.queryForObject
import org.springframework.security.core.context.SecurityContext
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest
import org.springframework.security.oauth2.core.oidc.user.OidcUser
import org.springframework.security.web.context.HttpSessionSecurityContextRepository
import org.springframework.session.FindByIndexNameSessionRepository

/** Sessions are stored in PostgreSQL (Spring Session JDBC), not in server memory. */
class PersistentSessionIT : IntegrationTest() {
    @Autowired private lateinit var authControllerCalls: AuthControllerCalls
    @Autowired private lateinit var sessionRepository: FindByIndexNameSessionRepository<*>
    @Autowired private lateinit var jdbcTemplate: JdbcTemplate

    @Test
    fun `should authenticate a cookie from a session that is loaded from the JDBC store`() {
        val cookie =
            TestSessionControllerCalls(http)
                .createSessionCookie(
                    roles = listOf(UserRole.KLEIDERWART),
                    username = "persisted.user",
                )
        val sessionId = sessionIdOf(cookie)

        val rowCount =
            jdbcTemplate.queryForObject<Int>(
                "SELECT COUNT(*) FROM spring_session WHERE session_id = ?",
                sessionId,
            )
        assertThat(rowCount).isEqualTo(1)

        // The repository has no in-memory cache: this reads and deserialises the stored row.
        val stored = sessionRepository.findById(sessionId)
        assertThat(stored).isNotNull
        val securityContext =
            checkNotNull(stored)
                .getAttribute<SecurityContext>(
                    HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                )
        val principal = securityContext?.authentication?.principal as? OidcUser
        assertThat(principal?.preferredUsername).isEqualTo("persisted.user")
        assertThat(securityContext?.authentication?.authorities?.map { it.authority })
            .contains("ROLE_KLEIDERWART")

        val me = authControllerCalls.me(cookie)

        assertThat(me.statusCode).isEqualTo(HttpStatus.OK)
        assertThat(me.body?.authenticated).isTrue
        assertThat(me.body?.user?.username).isEqualTo("persisted.user")
    }

    @Test
    fun `should keep the session cookie attributes`() {
        val response =
            TestSessionControllerCalls(http)
                .createSession(
                    TestSessionRequest(
                        username = "cookie.user",
                        firstName = "Cookie",
                        lastName = "User",
                        roles = listOf(UserRole.USER),
                    ),
                )

        val setCookie =
            response.headers[HttpHeaders.SET_COOKIE]?.firstOrNull { it.startsWith("OFSM_AUTH=") }
        assertThat(setCookie).isNotNull
        assertThat(setCookie).containsIgnoringCase("HttpOnly")
        assertThat(setCookie).containsIgnoringCase("Secure")
        assertThat(setCookie).containsIgnoringCase("SameSite=Lax")
    }

    @Test
    fun `should serialise the saved authorization request and the login redirect`() {
        val authorizationRequest =
            OAuth2AuthorizationRequest.authorizationCode()
                .authorizationUri("http://provider.example/authorize")
                .clientId("ofsm")
                .redirectUri("http://localhost/login/oauth2/code/ofsm")
                .scopes(setOf("openid", "profile"))
                .state("state-value")
                .attributes { it["registration_id"] = "ofsm" }
                .additionalParameters { it["code_challenge"] = "challenge" }
                .build()
        // Spring Session JDBC stores attributes with exactly these converters (JDK serialisation).
        val serialize = SerializingConverter()
        val deserialize = DeserializingConverter()

        val loadedRequest = deserialize.convert(serialize.convert(authorizationRequest))
        val loadedRedirect = deserialize.convert(serialize.convert("/dashboard"))

        assertThat(loadedRequest).isEqualTo(authorizationRequest)
        assertThat(loadedRedirect).isEqualTo("/dashboard")
    }

    /** The cookie value is the Base64 encoded session id (Spring Session's default). */
    private fun sessionIdOf(cookie: String): String =
        String(Base64.getDecoder().decode(cookie.removePrefix("OFSM_AUTH=")))
}
