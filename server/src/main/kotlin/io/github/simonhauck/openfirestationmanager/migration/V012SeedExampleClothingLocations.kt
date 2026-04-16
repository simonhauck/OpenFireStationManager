package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V012SeedExampleClothingLocations : DatabaseMigration {
    override val id = "V012__seed_example_clothing_locations"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        insertLocationIfMissing(jdbcTemplate, "Lager")
        insertLocationIfMissing(jdbcTemplate, "Wäsche")
        insertLocationIfMissing(jdbcTemplate, "Spint-1")
        insertLocationIfMissing(jdbcTemplate, "Spint-2")
        insertLocationIfMissing(jdbcTemplate, "Spint-3")
    }

    private fun insertLocationIfMissing(jdbcTemplate: JdbcTemplate, name: String) {
        jdbcTemplate.update(
            """
            INSERT INTO clothing_locations (name, comment)
            SELECT ?, ''
            WHERE NOT EXISTS (
                SELECT 1
                FROM clothing_locations
                WHERE name = ?
            )
            """
                .trimIndent(),
            name,
            name,
        )
    }
}
