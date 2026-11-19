package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.clothing.type.CreateOrUpdateClothingTypeRequest
import io.github.simonhauck.openfirestationmanager.clothing.type.ProtectiveClothingTypeControllerCalls
import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import java.net.URI
import java.net.URLDecoder
import java.net.URLEncoder
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.nio.charset.StandardCharsets
import java.util.UUID
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.util.UriComponentsBuilder

/**
 * Drives the authorization code flow against the mock OpenID Connect provider, following every
 * redirect by hand so each hop can be asserted. The provider's login form accepts any username
 * plus extra claims; `sub` becomes the username.
 */
class OidcLoginIT : IntegrationTest() {

    @Value("\${local.server.port}") private var port: Int = 0

    @Autowired private lateinit var authControllerCalls: AuthControllerCalls
    @Autowired private lateinit var typeCalls: ProtectiveClothingTypeControllerCalls

    private val client: HttpClient =
        HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .followRedirects(HttpClient.Redirect.NEVER)
            .build()

    private val adminClaims =
        """
        {
          "preferred_username": "alice.admin",
          "given_name": "Alice",
          "family_name": "Admin",
          "email": "alice@example.org",
          "realm_access": { "roles": ["ofsm-admin", "offline_access"] }
        }
        """
            .trimIndent()

    @Test
    fun `login returns to the requested page and me reports the mapped roles`() {
        val result = signIn(redirect = "/pool-clothing/checkout", claims = adminClaims)

        assertThat(result.finalLocation).isEqualTo("/pool-clothing/checkout")

        val me = authControllerCalls.me(result.cookie).body
        assertThat(me?.authenticated).isTrue
        assertThat(me?.user)
            .isEqualTo(
                CurrentUser(
                    username = "alice.admin",
                    firstName = "Alice",
                    lastName = "Admin",
                    email = "alice@example.org",
                    roles = UserRole.entries.toList(),
                ),
            )
    }

    @Test
    fun `a provider role is mapped to the OFSM role through the configured non identity mapping`() {
        val claims =
            """
            {
              "preferred_username": "kim.kleiderwart",
              "realm_access": { "roles": ["ofsm-kleiderwart", "offline_access"] }
            }
            """
                .trimIndent()

        val cookie = signIn(redirect = "/dashboard", claims = claims).cookie

        assertThat(authControllerCalls.me(cookie).body?.user?.roles)
            .containsExactly(UserRole.KLEIDERWART)
    }

    @Test
    fun `provider roles that are not mapped grant no OFSM role`() {
        val claims =
            """
            {
              "preferred_username": "uli.unmapped",
              "realm_access": { "roles": ["KLEIDERWART", "ADMIN", "USER"] }
            }
            """
                .trimIndent()

        val cookie = signIn(redirect = "/dashboard", claims = claims).cookie

        assertThat(authControllerCalls.me(cookie).body?.user?.roles).isEmpty()
    }

    @Test
    fun `login ignores open redirect targets and returns to the dashboard`() {
        val result = signIn(redirect = "//evil.example", claims = adminClaims)

        assertThat(result.finalLocation).isEqualTo("/dashboard")
    }

    @Test
    fun `entities saved in an oidc session are audited with the provider username`() {
        val cookie = signIn(redirect = "/dashboard", claims = adminClaims).cookie

        val created =
            typeCalls
                .createType(
                    CreateOrUpdateClothingTypeRequest(name = "Audit-${UUID.randomUUID()}"),
                    authCookie = cookie,
                )
                .body

        assertThat(created?.metaData?.createdBy).isEqualTo("alice.admin")
        assertThat(created?.metaData?.lastModifiedBy).isEqualTo("alice.admin")
    }

    @Test
    fun `logout ends the session and redirects to the provider's end session endpoint`() {
        val cookie = signIn(redirect = "/dashboard", claims = adminClaims).cookie

        val logout = send(appRequest("/api/public/auth/logout", cookie).POST(noBody()).build())

        assertThat(logout.statusCode()).isEqualTo(302)
        val location = logout.location()
        assertThat(location).startsWith("${oidcProvider.issuerUri()}/endsession?")
        val query = UriComponentsBuilder.fromUriString(location).build().queryParams
        assertThat(query.getFirst("id_token_hint")).isNotBlank()
        assertThat(decode(query.getFirst("post_logout_redirect_uri")))
            .isEqualTo("http://localhost:$port/")

        assertThat(authControllerCalls.me(cookie).body?.authenticated).isFalse
    }

    @Test
    fun `a failed login redirects to the login error page`() {
        val callback =
            send(appRequest("/login/oauth2/code/ofsm?code=unknown&state=unknown").build())

        assertThat(callback.statusCode()).isEqualTo(302)
        assertThat(callback.location()).isEqualTo("/login?error")
    }

    private data class SignInResult(val finalLocation: String, val cookie: String)

    private fun signIn(redirect: String, claims: String): SignInResult {
        val entry =
            send(appRequest("/api/public/auth/login?redirect=${encode(redirect)}").build())
        assertThat(entry.statusCode()).isEqualTo(302)
        var cookie = entry.sessionCookie() ?: error("Login entry point did not start a session")

        val authorizationRequest = send(appRequest(entry.location(), cookie).build())
        assertThat(authorizationRequest.statusCode()).isEqualTo(302)
        cookie = authorizationRequest.sessionCookie() ?: cookie
        val providerLoginUrl = authorizationRequest.location()
        assertThat(providerLoginUrl).startsWith(oidcProvider.issuerUri())
        assertThat(providerLoginUrl).contains("code_challenge=")

        val providerLogin =
            send(
                HttpRequest.newBuilder(URI.create(providerLoginUrl))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(
                        HttpRequest.BodyPublishers.ofString(
                            "username=alice&claims=${encode(claims)}",
                        ),
                    )
                    .build(),
            )
        assertThat(providerLogin.statusCode()).isEqualTo(302)

        val callback = send(appRequest(providerLogin.location(), cookie).build())
        assertThat(callback.statusCode()).isEqualTo(302)
        cookie = callback.sessionCookie() ?: cookie

        return SignInResult(finalLocation = callback.location(), cookie = cookie)
    }

    /** Builds a request against the application; [pathOrUrl] may be absolute or relative. */
    private fun appRequest(pathOrUrl: String, cookie: String? = null): HttpRequest.Builder {
        val uri = URI.create("http://localhost:$port/").resolve(pathOrUrl)
        val builder = HttpRequest.newBuilder(uri)
        if (cookie != null) builder.header("Cookie", cookie)
        return builder
    }

    private fun send(request: HttpRequest): HttpResponse<String> =
        client.send(request, HttpResponse.BodyHandlers.ofString())

    private fun noBody(): HttpRequest.BodyPublisher = HttpRequest.BodyPublishers.noBody()

    private fun HttpResponse<*>.location(): String =
        headers().firstValue("Location").orElseThrow { AssertionError("No Location header") }

    /** Returns the session cookie set by this response as a `Cookie` header value. */
    private fun HttpResponse<*>.sessionCookie(): String? =
        headers()
            .allValues("Set-Cookie")
            .map { it.substringBefore(";") }
            .firstOrNull { it.startsWith("OFSM_AUTH=") }

    private fun encode(value: String): String = URLEncoder.encode(value, StandardCharsets.UTF_8)

    private fun decode(value: String?): String? =
        value?.let { URLDecoder.decode(it, StandardCharsets.UTF_8) }
}
