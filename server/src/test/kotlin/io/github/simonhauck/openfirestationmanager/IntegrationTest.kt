package io.github.simonhauck.openfirestationmanager

import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest(
    properties = [
        "spring.docker.compose.skip.in-tests=false"
    ]
)
class IntegrationTest {
}