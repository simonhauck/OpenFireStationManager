package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate

interface DatabaseMigration {
    val id: String
    fun execute(jdbcTemplate: JdbcTemplate)
}
