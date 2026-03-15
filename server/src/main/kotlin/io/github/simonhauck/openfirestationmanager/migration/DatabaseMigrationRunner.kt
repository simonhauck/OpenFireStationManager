package io.github.simonhauck.openfirestationmanager.migration

import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.queryForList
import org.springframework.stereotype.Component
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.support.TransactionTemplate

@Component
class DatabaseMigrationRunner(
    private val jdbcTemplate: JdbcTemplate,
    private val migrations: List<DatabaseMigration>,
    transactionManager: PlatformTransactionManager,
) : ApplicationRunner {

    private val log = LoggerFactory.getLogger(DatabaseMigrationRunner::class.java)
    private val transactionTemplate = TransactionTemplate(transactionManager)

    override fun run(args: ApplicationArguments) {
        createMigrationTableIfNotExists()
        val appliedMigrations = getAppliedMigrations()
        val pendingMigrations = migrations.sortedBy { it.id }.filter { it.id !in appliedMigrations }

        for (migration in pendingMigrations) {
            log.info("Applying migration: ${migration.id}")
            transactionTemplate.executeWithoutResult {
                migration.execute(jdbcTemplate)
                recordMigration(migration.id)
            }
            log.info("Applied migration: ${migration.id}")
        }
    }

    private fun createMigrationTableIfNotExists() {
        jdbcTemplate.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
                .trimIndent()
        )
    }

    private fun getAppliedMigrations(): Set<String> =
        jdbcTemplate
            .queryForList<String>("SELECT id FROM schema_migrations")
            .filterNotNull()
            .toSet()

    private fun recordMigration(id: String) {
        jdbcTemplate.update("INSERT INTO schema_migrations (id) VALUES (?)", id)
    }
}
