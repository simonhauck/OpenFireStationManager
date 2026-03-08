package io.github.simonhauck.openfirestationmanager.user

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf
import org.springframework.test.web.servlet.MockMvc
import org.springframework.mock.web.MockHttpSession
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID

class AdminUserControllerIT : IntegrationTest() {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun createInitialAdmin() {
        val payload = """
            {
              "username": "admin",
              "password": "admin1234"
            }
        """.trimIndent()

        mockMvc.perform(
            post("/api/public/setup/initial-admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload),
        )
            .andExpect(status().isCreated)
    }

    @Test
    fun createUserShouldReturnUnauthorizedWithoutAuthentication() {
        val payload = """
            {
              "username": "new-user",
              "password": "password123",
                            "roles": ["USER"]
            }
        """.trimIndent()

        mockMvc.perform(
            post("/api/admin/users")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload),
        )
            .andExpect(status().isForbidden)
    }

    @Test
    fun createUserShouldSucceedForAdmin() {
        val loginPayload = """
            {
              "username": "admin",
              "password": "admin1234",
              "rememberMe": false
            }
        """.trimIndent()

        val loginResult = mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginPayload),
        )
            .andExpect(status().isOk)
            .andReturn()

        val session = loginResult.request.session as? MockHttpSession
            ?: error("Expected login to create a mock HTTP session")

        val username = "created-by-admin-${UUID.randomUUID()}"

        val createPayload = """
            {
              "username": "$username",
              "password": "password123",
                            "roles": ["USER"]
            }
        """.trimIndent()

        mockMvc.perform(
            post("/api/admin/users")
                .session(session)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(createPayload),
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.username").value(username))
            .andExpect(jsonPath("$.roles[0]").value("USER"))
    }
}
