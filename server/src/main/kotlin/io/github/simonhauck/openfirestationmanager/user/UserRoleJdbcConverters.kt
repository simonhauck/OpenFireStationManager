package io.github.simonhauck.openfirestationmanager.user

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.ReadingConverter
import org.springframework.data.convert.WritingConverter
import org.springframework.data.jdbc.core.convert.JdbcCustomConversions

@Configuration
class UserRoleJdbcConverters {
    @Bean
    fun jdbcCustomConversions(): JdbcCustomConversions {
        return JdbcCustomConversions(
            listOf(UserRolesToStringConverter(), StringToUserRolesConverter())
        )
    }
}

@WritingConverter
class UserRolesToStringConverter : Converter<List<UserRole>, String> {
    override fun convert(source: List<UserRole>): String = source.joinToString(",") { it.name }
}

@ReadingConverter
class StringToUserRolesConverter : Converter<String, List<UserRole>> {
    override fun convert(source: String): List<UserRole> {
        if (source.isBlank()) {
            return emptyList()
        }

        return source.split(',').map(UserRole::valueOf)
    }
}
