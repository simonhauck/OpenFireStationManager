package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class RoleMapperTest {

    private val devRealmMapping =
        mapOf(
            UserRole.ADMIN to listOf("ofsm-admin"),
            UserRole.KLEIDERWART to listOf("ofsm-kleiderwart", "kleiderkammer"),
            UserRole.USER to listOf("ofsm-user"),
        )

    private fun realmRoles(vararg roles: String): Map<String, Any?> =
        mapOf("realm_access" to mapOf("roles" to roles.toList()))

    @Test
    fun `maps provider roles through the configured mapping and ignores unmapped roles`() {
        val roles =
            RoleMapper(devRealmMapping)
                .map(realmRoles("kleiderkammer", "ofsm-user", "offline_access", "KLEIDERWART"))

        assertThat(roles).containsExactly(UserRole.USER, UserRole.KLEIDERWART)
    }

    @Test
    fun `uses identity mapping when no mapping is configured`() {
        val roles = RoleMapper(null).map(realmRoles("KLEIDERWART", "ofsm-admin"))

        assertThat(roles).containsExactly(UserRole.KLEIDERWART)
    }

    @Test
    fun `admin is expanded to every role`() {
        val roles = RoleMapper(devRealmMapping).map(realmRoles("ofsm-admin"))

        assertThat(roles).containsExactlyElementsOf(UserRole.entries)
    }

    @Test
    fun `accepts a single string claim value`() {
        val roles = RoleMapper(null).map(mapOf("realm_access" to mapOf("roles" to "USER")))

        assertThat(roles).containsExactly(UserRole.USER)
    }

    @Test
    fun `returns no roles when the claim is missing`() {
        val roles = RoleMapper(devRealmMapping).map(mapOf("sub" to "someone"))

        assertThat(roles).isEmpty()
    }
}
