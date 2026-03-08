package io.github.simonhauck.openfirestationmanager.setup

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import io.github.simonhauck.openfirestationmanager.user.UserRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

class InitialAdminSetupIT : IntegrationTest() {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var userRepository: UserRepository

    @BeforeEach
    fun deleteAllUsers() {
        userRepository.deleteAll()
    }

    @Test
    fun shouldCreateInitialAdminWhenNoUsersExist() {
        val payload = """
            {
              "username": "first-admin",
              "password": "password123"
            }
        """.trimIndent()

        mockMvc.perform(
            post("/api/public/setup/initial-admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload),
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.username").value("first-admin"))
            .andExpect(jsonPath("$.roles[0]").value("ADMIN"))
    }

    @Test
    fun shouldRejectInitialAdminCreationWhenAUserAlreadyExists() {
        val payload = """
            {
              "username": "first-admin",
              "password": "password123"
            }
        """.trimIndent()

        mockMvc.perform(
            post("/api/public/setup/initial-admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload),
        )
            .andExpect(status().isCreated)

        mockMvc.perform(
            post("/api/public/setup/initial-admin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                        {
                          "username": "second-admin",
                          "password": "password123"
                        }
                    """.trimIndent(),
                ),
        )
            .andExpect(status().isConflict)
    }
}
