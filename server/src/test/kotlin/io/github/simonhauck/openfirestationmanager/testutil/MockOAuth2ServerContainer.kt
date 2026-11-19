package io.github.simonhauck.openfirestationmanager.testutil

import org.testcontainers.containers.GenericContainer
import org.testcontainers.containers.wait.strategy.Wait
import org.testcontainers.utility.DockerImageName

/**
 * A mock OpenID Connect provider (`navikt/mock-oauth2-server`) for integration tests.
 *
 * Its login page accepts any username plus a JSON object of extra claims, which become the claims
 * of the issued ID token and the UserInfo response, with `sub` set to the username.
 */
class MockOAuth2ServerContainer :
    GenericContainer<MockOAuth2ServerContainer>(DockerImageName.parse(IMAGE)) {

    init {
        withExposedPorts(PORT)
        waitingFor(Wait.forHttp("/isalive").forPort(PORT))
    }

    /** Issuer URI as seen from the test JVM, e.g. `http://localhost:32768/default`. */
    fun issuerUri(): String = "http://$host:${getMappedPort(PORT)}/$ISSUER_ID"

    private companion object {
        const val IMAGE = "ghcr.io/navikt/mock-oauth2-server:7.0.1"
        const val PORT = 8080
        const val ISSUER_ID = "default"
    }
}
