package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V002AddFirstAndLastNameToUsersTable : DatabaseMigration {
    override val id = "V002__add_first_and_last_name_to_users_table"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) NOT NULL DEFAULT ''
            """
                .trimIndent()
        )

        jdbcTemplate.execute(
            """
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS last_name VARCHAR(100) NOT NULL DEFAULT ''
            """
                .trimIndent()
        )
    }
}
