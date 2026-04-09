package io.github.simonhauck.openfirestationmanager.migration

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.DefaultApplicationArguments
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.queryForList
import org.springframework.jdbc.core.queryForObject
import org.springframework.transaction.PlatformTransactionManager

class DatabaseMigrationRunnerIT : IntegrationTest() {

    @Autowired private lateinit var jdbcTemplate: JdbcTemplate
    @Autowired private lateinit var transactionManager: PlatformTransactionManager

    @Test
    fun `should create schema_migrations table and record all applied migrations`() {
        val appliedIds =
            jdbcTemplate.queryForList<String>("SELECT id FROM schema_migrations ORDER BY id")

        assertThat(appliedIds).contains("V001__create_users_table")
        assertThat(appliedIds).contains("V009__rename_protective_clothing_types_to_clothing_types")
        assertThat(appliedIds).contains("V008__seed_example_clothing_items")
    }

    @Test
    fun `should seed five example clothing items for each default clothing type`() {
        val seededItemCountPerType =
            jdbcTemplate.queryForObject<Int>(
                """
                SELECT COALESCE(MIN(type_item_count), 0)
                FROM (
                    SELECT COUNT(c.id) AS type_item_count
                    FROM clothing_types t
                    LEFT JOIN clothing_items c ON c.type_id = t.id
                    WHERE t.name IN ('Einsatzjacke', 'Einsatzhose', 'TH-Jacke', 'Brandhandschuhe')
                    GROUP BY t.id
                ) counts
                """
                    .trimIndent()
            )

        assertThat(seededItemCountPerType).isGreaterThanOrEqualTo(5)
    }

    @Test
    fun `should expose clothing types through the renamed table`() {
        val tableExists =
            jdbcTemplate.queryForObject<Boolean>(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                      AND table_name = 'clothing_types'
                )
                """
                    .trimIndent()
            )

        assertThat(tableExists).isTrue()
    }

    @Test
    fun `should not reapply already applied migrations on repeated run`() {
        val countBefore =
            jdbcTemplate.queryForObject<Long>("SELECT COUNT(*) FROM schema_migrations")

        val runner = DatabaseMigrationRunner(jdbcTemplate, emptyList(), transactionManager)
        runner.run(DefaultApplicationArguments())

        val countAfter = jdbcTemplate.queryForObject<Long>("SELECT COUNT(*) FROM schema_migrations")

        assertThat(countAfter).isEqualTo(countBefore)
    }
}
