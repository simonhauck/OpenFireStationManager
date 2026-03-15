package io.github.simonhauck.openfirestationmanager.db

import java.sql.Timestamp
import java.sql.JDBCType
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.ZonedDateTime
import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.ReadingConverter
import org.springframework.data.convert.WritingConverter
import org.springframework.data.jdbc.core.mapping.JdbcValue
import org.springframework.stereotype.Component

@Component
@WritingConverter
class ZonedDateTimeToTimestampConverter :
    Converter<ZonedDateTime, JdbcValue>, SpringDataJdbcConverter {
    override fun convert(source: ZonedDateTime): JdbcValue {
        val format = LocalDateTime.ofInstant(source.toInstant(), ZoneOffset.UTC)
        return JdbcValue.of(Timestamp.valueOf(format), JDBCType.TIMESTAMP)
    }
}

@Component
@ReadingConverter
class TimestampToZonedDateTimeConverter() :
    Converter<Timestamp, ZonedDateTime>, SpringDataJdbcConverter {

    override fun convert(source: Timestamp): ZonedDateTime {
        return ZonedDateTime.ofInstant(
            source.toLocalDateTime(),
            ZoneOffset.UTC,
            ZoneId.systemDefault(),
        )
    }
}
