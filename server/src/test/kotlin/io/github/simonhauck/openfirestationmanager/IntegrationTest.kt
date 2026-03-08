package io.github.simonhauck.openfirestationmanager

import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest(
    properties = [
        "spring.docker.compose.skip.in-tests=false",
        "app.auth.jwt-signing-secret=12345678901234567890123456789012",
    ]
)
@AutoConfigureMockMvc
class IntegrationTest
