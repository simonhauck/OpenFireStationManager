package io.github.simonhauck.openfirestationmanager.db

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.jdbc.core.convert.JdbcCustomConversions

interface SpringDataJdbcConverter {}

@Configuration
class SpringDataJdbcConvertConfiguration {
    @Bean
    fun jdbcCustomConversions(
        springDataJdbcConverter: List<SpringDataJdbcConverter>
    ): JdbcCustomConversions {
        return JdbcCustomConversions(springDataJdbcConverter)
    }
}
