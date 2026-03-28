package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V007CreateClothingItemsTable : DatabaseMigration {
    override val id = "V007__create_clothing_items_table"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            CREATE TABLE IF NOT EXISTS clothing_items (
                id BIGSERIAL PRIMARY KEY,
                type_id BIGINT NOT NULL REFERENCES protective_clothing_types(id),
                size VARCHAR(255) NOT NULL,
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
