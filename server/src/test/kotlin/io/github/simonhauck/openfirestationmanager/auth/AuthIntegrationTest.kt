package io.github.simonhauck.openfirestationmanager.auth

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class AuthIntegrationTest : IntegrationTest() {
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
    fun loginShouldCreateAuthenticatedSession() {
        val payload = """
            {
              "username": "admin",
              "password": "admin1234",
              "rememberMe": false
            }
        """.trimIndent()

        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.authenticated").value(true))
            .andExpect(jsonPath("$.user.username").value("admin"))
            .andExpect(jsonPath("$.user.roles[0]").value("ADMIN"))
    }

    @Test
    fun meShouldReturnAnonymousWhenNoSessionExists() {
        mockMvc.perform(get("/api/auth/me"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.authenticated").value(false))
    }

    @Test
    fun loginWithRememberMeShouldSetRememberCookie() {
        val payload = """
            {
              "username": "admin",
              "password": "admin1234",
              "rememberMe": true
            }
        """.trimIndent()

        mockMvc.perform(
            post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload),
        )
            .andExpect(status().isOk)
            .andExpect(cookie().exists("REMEMBER_ME"))
    }
}
