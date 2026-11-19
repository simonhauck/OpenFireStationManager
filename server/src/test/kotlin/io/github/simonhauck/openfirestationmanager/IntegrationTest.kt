package io.github.simonhauck.openfirestationmanager

import io.github.simonhauck.openfirestationmanager.testing.TestSessionControllerCalls
import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.PostgreSQLContainer

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
@ActiveProfiles("test")
open class IntegrationTest {

    @Autowired protected lateinit var http: TestRestTemplate

    protected lateinit var validCookieHeader: String

    @BeforeEach
    fun setUp() {
        if (!hasRunInit) {
            staticCookieHeader =
                TestSessionControllerCalls(http)
                    .createSessionCookie(
                        roles = listOf(UserRole.ADMIN),
                        username = "chief",
                        firstName = "Initial",
                        lastName = "Admin",
                    )
            hasRunInit = true
        }
        validCookieHeader = staticCookieHeader
    }

    /** Returns a session cookie for a test user holding exactly the given roles. */
    protected fun cookieWithRoles(vararg roles: UserRole): String =
        TestSessionControllerCalls(http).createSessionCookie(roles = roles.toList())

    companion object {
        private var hasRunInit = false
        private var staticCookieHeader: String = ""

        private val postgresContainer =
            PostgreSQLContainer("postgres:18")
                .withDatabaseName("mydatabase")
                .withUsername("myuser")
                .withPassword("secret")
                .apply { start() }

        @DynamicPropertySource
        @JvmStatic
        fun configureDatabaseProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgresContainer::getJdbcUrl)
            registry.add("spring.datasource.username", postgresContainer::getUsername)
            registry.add("spring.datasource.password", postgresContainer::getPassword)
        }
    }
}
