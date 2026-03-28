package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V005RenameGeraetewartToKleiderwart : DatabaseMigration {
    override val id: String
        get() = "V005__rename_geraetewart_to_kleiderwart"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            UPDATE users
            SET roles = REPLACE(roles, 'GERAETEWART', 'KLEIDERWART')
            WHERE roles LIKE '%GERAETEWART%'
            """
                .trimIndent()
        )
    }
}
