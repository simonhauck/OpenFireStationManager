package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V011CreateClothingLocationsTable : DatabaseMigration {
    override val id = "V011__create_clothing_locations_table"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            CREATE TABLE IF NOT EXISTS clothing_locations (
                id BIGSERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                comment VARCHAR(255) NOT NULL,
                only_visible_for_kleiderwart BOOLEAN NOT NULL DEFAULT FALSE,
                should_be_shown_on_dashboard BOOLEAN NOT NULL DEFAULT FALSE,
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
