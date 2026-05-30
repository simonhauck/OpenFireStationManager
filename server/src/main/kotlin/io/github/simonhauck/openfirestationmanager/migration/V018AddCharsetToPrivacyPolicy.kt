package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V018AddCharsetToPrivacyPolicy : DatabaseMigration {
    override val id = "V018__add_charset_to_privacy_policy"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            ALTER TABLE privacy_policy ADD COLUMN IF NOT EXISTS charset TEXT
            """
                .trimIndent()
        )
    }
}
