package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V009AddUserIdentifierToClothingItems : DatabaseMigration {
    override val id = "V009__add_user_identifier_to_clothing_items"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            ALTER TABLE clothing_items
            ADD COLUMN IF NOT EXISTS user_identifier VARCHAR(255) NULL
            """
                .trimIndent()
        )
        jdbcTemplate.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS clothing_items_user_identifier_unique
            ON clothing_items (user_identifier)
            WHERE user_identifier IS NOT NULL
            """
                .trimIndent()
        )
    }
}
