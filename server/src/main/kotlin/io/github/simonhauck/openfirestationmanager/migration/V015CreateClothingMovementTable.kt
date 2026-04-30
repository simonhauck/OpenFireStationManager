package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V015CreateClothingMovementTable : DatabaseMigration {
    override val id = "V015__create_clothing_movement_table"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            CREATE TABLE IF NOT EXISTS clothing_movements (
                id BIGSERIAL PRIMARY KEY,
                item_id BIGINT NOT NULL REFERENCES clothing_items(id) ON DELETE CASCADE,
                from_location_id BIGINT REFERENCES clothing_locations(id) ON DELETE SET NULL,
                to_location_id BIGINT REFERENCES clothing_locations(id) ON DELETE SET NULL,
                performed_at TIMESTAMP WITH TIME ZONE NOT NULL,
                performed_by_user_id VARCHAR(255) NOT NULL,
                reason VARCHAR(50) NOT NULL,
                batch_id VARCHAR(255)
            )
            """
                .trimIndent()
        )
    }
}
