package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V014AddTypeToClothingLocations : DatabaseMigration {
    override val id = "V014__add_type_to_clothing_locations"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            ALTER TABLE clothing_locations
            ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'OTHER'
            """
                .trimIndent()
        )
        jdbcTemplate.execute(
            """
            UPDATE clothing_locations
            SET type = CASE
                WHEN should_be_shown_on_dashboard = TRUE THEN 'POOL'
                ELSE 'OTHER'
            END
            """
                .trimIndent()
        )
        jdbcTemplate.execute(
            """
            ALTER TABLE clothing_locations
            ALTER COLUMN type DROP DEFAULT
            """
                .trimIndent()
        )
        jdbcTemplate.execute(
            """
            ALTER TABLE clothing_locations
            DROP COLUMN IF EXISTS should_be_shown_on_dashboard
            """
                .trimIndent()
        )
    }
}
