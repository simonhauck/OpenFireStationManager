package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V019CreateImpressumTable : DatabaseMigration {
    override val id = "V019__create_impressum_table"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            CREATE TABLE IF NOT EXISTS impressum (
                id BIGSERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                address TEXT NOT NULL,
                contact_email TEXT NOT NULL,
                phone TEXT,
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
