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
        assertThat(appliedIds).contains("V008__seed_example_clothing_items")
        assertThat(appliedIds).contains("V009__rename_protective_clothing_types_to_clothing_types")
        assertThat(appliedIds).contains("V022__migrate_clothing_location_comments_to_members")
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
    fun `should migrate personal location comments to deduplicated members`() {
        val suffix = System.nanoTime()
        val ownerName = "Legacy Owner $suffix"
        val firstLocation = "Legacy Locker A $suffix"
        val secondLocation = "Legacy Locker B $suffix"
        val poolCommentLocation = "Legacy Pool Comment $suffix"
        val poolNameLocation = "Legacy Pool Name $suffix"
        val otherLocation = "Legacy Other $suffix"
        val blankLocation = "Legacy Blank $suffix"

        jdbcTemplate.update(
            "INSERT INTO clothing_locations (name, comment, type) VALUES (?, ?, ?)",
            firstLocation,
            ownerName,
            "PERSONAL",
        )
        jdbcTemplate.update(
            "INSERT INTO clothing_locations (name, comment, type) VALUES (?, ?, ?)",
            secondLocation,
            ownerName,
            "PERSONAL",
        )
        jdbcTemplate.update(
            "INSERT INTO clothing_locations (name, comment, type) VALUES (?, ?, ?)",
            poolCommentLocation,
            "Pool storage",
            "PERSONAL",
        )
        jdbcTemplate.update(
            "INSERT INTO clothing_locations (name, comment, type) VALUES (?, ?, ?)",
            poolNameLocation,
            ownerName,
            "PERSONAL",
        )
        jdbcTemplate.update(
            "INSERT INTO clothing_locations (name, comment, type) VALUES (?, ?, ?)",
            otherLocation,
            ownerName,
            "OTHER",
        )
        jdbcTemplate.update(
            "INSERT INTO clothing_locations (name, comment, type) VALUES (?, ?, ?)",
            blankLocation,
            "",
            "PERSONAL",
        )

        try {
            V022MigrateClothingLocationCommentsToMembers().execute(jdbcTemplate)

            assertThat(
                    jdbcTemplate.queryForObject<Long>(
                        "SELECT COUNT(*) FROM members WHERE name = ?",
                        ownerName,
                    )
                )
                .isEqualTo(1)
            assertThat(
                    jdbcTemplate.queryForObject<Long>(
                        "SELECT COUNT(*) FROM clothing_locations WHERE member_id = (SELECT id FROM members WHERE name = ?) AND comment = ''",
                        ownerName,
                    )
                )
                .isEqualTo(2)
            assertThat(
                    jdbcTemplate.queryForObject<Long>(
                        "SELECT COUNT(*) FROM clothing_locations WHERE name IN (?, ?, ?, ? ,?) AND member_id IS NULL",
                        poolCommentLocation,
                        poolNameLocation,
                        otherLocation,
                        blankLocation,
                        firstLocation,
                    )
                )
                .isEqualTo(4)

            V022MigrateClothingLocationCommentsToMembers().execute(jdbcTemplate)
            assertThat(
                    jdbcTemplate.queryForObject<Long>(
                        "SELECT COUNT(*) FROM members WHERE name = ?",
                        ownerName,
                    )
                )
                .isEqualTo(1)
        } finally {
            jdbcTemplate.update(
                "DELETE FROM clothing_locations WHERE name IN (?, ?, ?, ?, ?, ?)",
                firstLocation,
                secondLocation,
                poolCommentLocation,
                poolNameLocation,
                otherLocation,
                blankLocation,
            )
            jdbcTemplate.update("DELETE FROM members WHERE name = ?", ownerName)
        }
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
