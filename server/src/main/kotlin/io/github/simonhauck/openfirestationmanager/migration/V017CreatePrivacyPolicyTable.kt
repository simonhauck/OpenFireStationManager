package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V017CreatePrivacyPolicyTable : DatabaseMigration {
    override val id = "V017__create_privacy_policy_table"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            CREATE TABLE IF NOT EXISTS privacy_policy (
                id BIGSERIAL PRIMARY KEY,
                file_name TEXT NOT NULL,
                content_type TEXT NOT NULL,
                file_size BIGINT NOT NULL,
                uploaded_at TIMESTAMPTZ NOT NULL,
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
