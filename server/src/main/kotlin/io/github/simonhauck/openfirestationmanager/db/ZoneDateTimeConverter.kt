package io.github.simonhauck.openfirestationmanager.db

import java.sql.Timestamp
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.ZonedDateTime
import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.ReadingConverter
import org.springframework.data.convert.WritingConverter
import org.springframework.stereotype.Component

@Component
@WritingConverter
class ZonedDateTimeToTimestampConverter :
    Converter<ZonedDateTime, Timestamp>, SpringDataJdbcConverter {
    override fun convert(source: ZonedDateTime): Timestamp {
        val format = LocalDateTime.ofInstant(source.toInstant(), ZoneOffset.UTC)
        return Timestamp.valueOf(format)
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
