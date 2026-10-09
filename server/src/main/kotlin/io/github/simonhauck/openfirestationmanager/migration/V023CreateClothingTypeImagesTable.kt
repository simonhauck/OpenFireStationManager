package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V023CreateClothingTypeImagesTable : DatabaseMigration {
    override val id = "V023__create_clothing_type_images_table"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            CREATE TABLE IF NOT EXISTS clothing_type_images (
                id BIGSERIAL PRIMARY KEY,
                type_id BIGINT NOT NULL REFERENCES clothing_types(id) ON DELETE CASCADE,
                content_type TEXT NOT NULL,
                file_size BIGINT NOT NULL,
                content BYTEA NOT NULL,
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
