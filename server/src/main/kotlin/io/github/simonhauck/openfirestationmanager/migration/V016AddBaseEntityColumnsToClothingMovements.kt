package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V016AddBaseEntityColumnsToClothingMovements : DatabaseMigration {
    override val id = "V016__add_base_entity_columns_to_clothing_movements"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            ALTER TABLE clothing_movements
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) NOT NULL DEFAULT 'System',
            ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS last_modified_by VARCHAR(100) NOT NULL DEFAULT 'System'
            """
                .trimIndent()
        )
        jdbcTemplate.execute(
            """
            UPDATE clothing_movements
            SET created_at = performed_at,
                last_modified_at = performed_at,
                created_by = performed_by_user_id,
                last_modified_by = performed_by_user_id
            """
                .trimIndent()
        )
        jdbcTemplate.execute(
            """
            ALTER TABLE clothing_movements
            DROP COLUMN IF EXISTS performed_at,
            DROP COLUMN IF EXISTS performed_by_user_id
            """
                .trimIndent()
        )
    }
}
