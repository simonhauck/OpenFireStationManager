package io.github.simonhauck.openfirestationmanager

import io.github.simonhauck.openfirestationmanager.setup.InitialAdminSetupRequest
import io.github.simonhauck.openfirestationmanager.setup.InitialSetupControllerCalls
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.resttestclient.TestRestTemplate
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.PostgreSQLContainer

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
open class IntegrationTest {

    @Autowired protected lateinit var http: TestRestTemplate

    private var hasRunInit = false

    protected lateinit var validToken: String

    @BeforeEach
    fun setUp() {
        if (!hasRunInit) {
            InitialSetupControllerCalls(http)
                .createInitialAdmin(
                    InitialAdminSetupRequest(username = "chief", password = "secret")
                )
            hasRunInit = true
        }
    }

    companion object {
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
