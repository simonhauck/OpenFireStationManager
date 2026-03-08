package io.github.simonhauck.openfirestationmanager

import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc

@SpringBootTest(properties = ["spring.docker.compose.skip.in-tests=false"])
@AutoConfigureMockMvc
class IntegrationTest
