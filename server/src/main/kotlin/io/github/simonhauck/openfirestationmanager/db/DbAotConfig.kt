package io.github.simonhauck.openfirestationmanager.db

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.jdbc.core.dialect.JdbcPostgresDialect


@Configuration
class DbAotConfig {
    @Bean
    fun jdbcDialect(): JdbcPostgresDialect {
        return JdbcPostgresDialect.INSTANCE
    }
}