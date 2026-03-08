package io.github.simonhauck.openfirestationmanager

import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.jdbc.core.JdbcTemplate

@SpringBootTest(
    properties = [
        "spring.docker.compose.skip.in-tests=false"
    ]
)
@AutoConfigureMockMvc
class IntegrationTest {
    @Autowired
    private lateinit var jdbcTemplate: JdbcTemplate

    @BeforeEach
    fun resetDatabase() {
        jdbcTemplate.execute("TRUNCATE TABLE persistent_logins")
        jdbcTemplate.execute("TRUNCATE TABLE users RESTART IDENTITY CASCADE")
    }
}