package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V011AddLocationIdToClothingItems : DatabaseMigration {
    override val id = "V011__add_location_id_to_clothing_items"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            ALTER TABLE clothing_items
                ADD COLUMN IF NOT EXISTS location_id BIGINT NULL REFERENCES clothing_locations(id)
            """
                .trimIndent()
        )
    }
}
