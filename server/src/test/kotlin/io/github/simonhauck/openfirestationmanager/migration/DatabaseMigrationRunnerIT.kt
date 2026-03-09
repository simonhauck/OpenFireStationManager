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
