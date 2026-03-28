package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V003AddMetadataColumnsToUsersTable : DatabaseMigration {
    override val id = "V003__add_metadata_columns_to_users_table"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) NOT NULL DEFAULT 'System'
            """
                .trimIndent()
        )

        jdbcTemplate.execute(
            """
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            """
                .trimIndent()
        )

        jdbcTemplate.execute(
            """
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(100) NOT NULL DEFAULT 'System'
            """
                .trimIndent()
        )
    }
}
