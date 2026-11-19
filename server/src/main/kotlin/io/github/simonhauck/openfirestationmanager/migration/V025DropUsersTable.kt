package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/**
 * Authentication is delegated to an OpenID Connect provider, so the local accounts, including
 * their password hashes, are no longer kept.
 */
@Component
class V025DropUsersTable : DatabaseMigration {
    override val id = "V025__drop_users_table"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute("DROP TABLE IF EXISTS users")
    }
}
