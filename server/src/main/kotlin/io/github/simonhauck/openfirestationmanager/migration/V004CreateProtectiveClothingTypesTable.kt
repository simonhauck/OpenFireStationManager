package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V004CreateProtectiveClothingTypesTable : DatabaseMigration {
    override val id = "V004__create_protective_clothing_types_table"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            CREATE TABLE IF NOT EXISTS protective_clothing_types (
                id BIGSERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
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
