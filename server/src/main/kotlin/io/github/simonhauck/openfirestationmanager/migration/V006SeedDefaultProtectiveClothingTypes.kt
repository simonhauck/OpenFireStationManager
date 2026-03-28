package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V006SeedDefaultProtectiveClothingTypes : DatabaseMigration {
    override val id: String
        get() = "V006__seed_default_protective_clothing_types"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        insertDefaultTypeIfMissing(jdbcTemplate, "Einsatzjacke")
        insertDefaultTypeIfMissing(jdbcTemplate, "Einsatzhose")
        insertDefaultTypeIfMissing(jdbcTemplate, "TH-Jacke")
        insertDefaultTypeIfMissing(jdbcTemplate, "Brandhandschuhe")
    }

    private fun insertDefaultTypeIfMissing(jdbcTemplate: JdbcTemplate, typeName: String) {
        jdbcTemplate.update(
            """
            INSERT INTO protective_clothing_types (name)
            SELECT ?
            WHERE NOT EXISTS (
                SELECT 1
                FROM protective_clothing_types
                WHERE name = ?
            )
            """
                .trimIndent(),
            typeName,
            typeName,
        )
    }
}
