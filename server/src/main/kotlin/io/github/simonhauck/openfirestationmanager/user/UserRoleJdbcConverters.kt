package io.github.simonhauck.openfirestationmanager.user

import io.github.simonhauck.openfirestationmanager.db.SpringDataJdbcConverter
import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.ReadingConverter
import org.springframework.data.convert.WritingConverter

@WritingConverter
class UserRolesToStringConverter : Converter<List<UserRole>, String>, SpringDataJdbcConverter {
    override fun convert(source: List<UserRole>): String = source.joinToString(",") { it.name }
}

@ReadingConverter
class StringToUserRolesConverter : Converter<String, List<UserRole>>, SpringDataJdbcConverter {
    override fun convert(source: String): List<UserRole> {
        if (source.isBlank()) {
            return emptyList()
        }

        return source.split(',').map(UserRole::valueOf)
    }
}
