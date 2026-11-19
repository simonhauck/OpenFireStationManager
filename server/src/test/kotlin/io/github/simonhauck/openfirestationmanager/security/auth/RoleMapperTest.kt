package io.github.simonhauck.openfirestationmanager.security.auth

import io.github.simonhauck.openfirestationmanager.usermanagement.UserRole
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
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
            RoleMapper(mapping = devRealmMapping)
                .map(realmRoles("kleiderkammer", "ofsm-user", "offline_access", "KLEIDERWART"))

        assertThat(roles).containsExactly(UserRole.USER, UserRole.KLEIDERWART)
    }

    @Test
    fun `uses identity mapping when no mapping is configured`() {
        val roles = RoleMapper().map(realmRoles("KLEIDERWART", "ofsm-admin"))

        assertThat(roles).containsExactly(UserRole.KLEIDERWART)
    }

    @Test
    fun `a configured mapping is authoritative and disables the identity mapping`() {
        val roles = RoleMapper(mapping = devRealmMapping).map(realmRoles("USER", "ADMIN"))

        assertThat(roles).isEmpty()
    }

    @Test
    fun `an OFSM role missing from a configured mapping is not granted`() {
        val mapping = mapOf(UserRole.USER to listOf("ofsm-user"))

        val roles = RoleMapper(mapping = mapping).map(realmRoles("ofsm-user", "KLEIDERWART"))

        assertThat(roles).containsExactly(UserRole.USER)
    }

    @Test
    fun `admin is expanded to every role`() {
        val roles = RoleMapper(mapping = devRealmMapping).map(realmRoles("ofsm-admin"))

        assertThat(roles).containsExactlyElementsOf(UserRole.entries)
    }

    @Test
    fun `accepts a single string claim value`() {
        val roles = RoleMapper().map(mapOf("realm_access" to mapOf("roles" to "USER")))

        assertThat(roles).containsExactly(UserRole.USER)
    }

    @Test
    fun `returns no roles when the claim is missing`() {
        val roles = RoleMapper(mapping = devRealmMapping).map(mapOf("sub" to "someone"))

        assertThat(roles).isEmpty()
    }

    @Test
    fun `reads a top level claim such as keycloak groups with full paths`() {
        val mapping = mapOf(UserRole.KLEIDERWART to listOf("/ofsm/kleiderkammer"))

        val roles =
            RoleMapper(listOf("groups"), mapping)
                .map(mapOf("groups" to listOf("/ofsm/kleiderkammer", "/other")))

        assertThat(roles).containsExactly(UserRole.KLEIDERWART)
    }

    @Test
    fun `navigates deeply nested claim paths`() {
        val claims =
            mapOf(
                "resource_access" to mapOf("ofsm" to mapOf("roles" to listOf("ofsm-user"))),
                "realm_access" to mapOf("roles" to listOf("ofsm-admin")),
            )

        val roles = RoleMapper(listOf("resource_access.ofsm.roles"), devRealmMapping).map(claims)

        assertThat(roles).containsExactly(UserRole.USER)
    }

    @Test
    fun `ignores paths that run into a non object or a missing segment`() {
        val claims = mapOf("realm_access" to "ofsm-admin", "resource_access" to mapOf("x" to 1))

        val roles =
            RoleMapper(
                    listOf("realm_access.roles", "resource_access.ofsm.roles", "nothing.here"),
                    devRealmMapping,
                )
                .map(claims)

        assertThat(roles).isEmpty()
    }

    @Test
    fun `unions roles from several claim paths and skips the missing ones`() {
        val claims =
            mapOf(
                "realm_access" to mapOf("roles" to listOf("ofsm-user")),
                "resource_access" to mapOf("ofsm" to mapOf("roles" to "ofsm-kleiderwart")),
            )
        val mapper =
            RoleMapper(
                listOf("realm_access.roles", "does.not.exist", "resource_access.ofsm.roles"),
                devRealmMapping,
            )

        assertThat(mapper.map(claims)).containsExactly(UserRole.USER, UserRole.KLEIDERWART)
    }

    @Test
    fun `maps several provider roles to the same OFSM role`() {
        val mapper = RoleMapper(mapping = devRealmMapping)

        assertThat(mapper.map(realmRoles("ofsm-kleiderwart"))).containsExactly(UserRole.KLEIDERWART)
        assertThat(mapper.map(realmRoles("kleiderkammer"))).containsExactly(UserRole.KLEIDERWART)
        assertThat(mapper.map(realmRoles("ofsm-kleiderwart", "kleiderkammer")))
            .containsExactly(UserRole.KLEIDERWART)
    }

    @Test
    fun `one provider role may grant several OFSM roles`() {
        val mapping =
            mapOf(
                UserRole.USER to listOf("staff"),
                UserRole.KLEIDERWART to listOf("staff", "ofsm-kleiderwart"),
            )

        val roles = RoleMapper(mapping = mapping).map(realmRoles("staff"))

        assertThat(roles).containsExactly(UserRole.USER, UserRole.KLEIDERWART)
    }

    @Test
    fun `matching is exact and case sensitive`() {
        val roles =
            RoleMapper(mapping = devRealmMapping)
                .map(realmRoles("OFSM-ADMIN", "ofsm-user ", "Ofsm-Kleiderwart"))

        assertThat(roles).isEmpty()
    }

    @Test
    fun `ignores non string claim values`() {
        val claims = mapOf("realm_access" to mapOf("roles" to listOf(1, null, "ofsm-user")))

        assertThat(RoleMapper(mapping = devRealmMapping).map(claims)).containsExactly(UserRole.USER)
    }

    @Test
    fun `role properties reject an unknown mapping key`() {
        assertThatThrownBy { RoleProperties(mapping = mapOf("KLEIDERWAERT" to listOf("x"))) }
            .isInstanceOf(IllegalArgumentException::class.java)
            .hasMessageContaining("app.auth.roles.mapping")
            .hasMessageContaining("KLEIDERWAERT")
            .hasMessageContaining("ADMIN")
    }

    @Test
    fun `role properties accept mapping keys in any case`() {
        val properties = RoleProperties(mapping = mapOf("kleiderwart" to listOf("x")))

        assertThat(properties.ofsmMapping).containsOnlyKeys(UserRole.KLEIDERWART)
    }

    @Test
    fun `role properties reject empty claim paths`() {
        assertThatThrownBy { RoleProperties(claimPaths = emptyList()) }
            .isInstanceOf(IllegalArgumentException::class.java)
            .hasMessageContaining("app.auth.roles.claim-paths")
    }

    @Test
    fun `role properties reject a claim path with an empty segment`() {
        assertThatThrownBy { RoleProperties(claimPaths = listOf("realm_access..roles")) }
            .isInstanceOf(IllegalArgumentException::class.java)
            .hasMessageContaining("realm_access..roles")
    }

    @Test
    fun `role properties default to realm roles and the identity mapping`() {
        val properties = RoleProperties()

        assertThat(properties.claimPaths).containsExactly("realm_access.roles")
        assertThat(properties.ofsmMapping).isNull()
    }

    @Test
    fun `role properties resolve mapping keys to OFSM roles`() {
        val properties =
            RoleProperties(mapping = mapOf("ADMIN" to listOf("a"), "USER" to listOf("b")))

        assertThat(properties.ofsmMapping)
            .containsExactlyInAnyOrderEntriesOf(
                mapOf(UserRole.ADMIN to listOf("a"), UserRole.USER to listOf("b")),
            )
    }
}
