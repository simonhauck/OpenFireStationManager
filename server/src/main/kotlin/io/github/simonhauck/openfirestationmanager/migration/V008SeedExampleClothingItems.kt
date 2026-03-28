package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V008SeedExampleClothingItems : DatabaseMigration {
    override val id: String
        get() = "V008__seed_example_clothing_items"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        val exampleSizes = listOf("XS", "S", "M", "L", "XL")

        exampleSizes.forEach { size ->
            jdbcTemplate.update(
                """
                INSERT INTO clothing_items (type_id, size)
                SELECT t.id, ?
                FROM protective_clothing_types t
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM clothing_items c
                    WHERE c.type_id = t.id
                      AND c.size = ?
                )
                """
                    .trimIndent(),
                size,
                size,
            )
        }
    }
}

