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
                reason VARCHAR(50) NOT NULL,
                batch_id VARCHAR(255),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                created_by VARCHAR(100) NOT NULL DEFAULT 'System',
                last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                last_modified_by VARCHAR(100) NOT NULL DEFAULT 'System'
            )
            """
                .trimIndent()
        )
    }
}
