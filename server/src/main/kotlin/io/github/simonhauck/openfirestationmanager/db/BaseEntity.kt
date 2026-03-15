package io.github.simonhauck.openfirestationmanager.db

import java.time.Instant
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.ZonedDateTime

data class EntityMetaData(
    val createdAt: ZonedDateTime = EPOCH_UTC,
    val createdBy: String = "System",
    val lastModifiedAt: ZonedDateTime = EPOCH_UTC,
    val lastModifiedBy: String = "System",
) {

    companion object {
        private val EPOCH_UTC: ZonedDateTime =
            ZonedDateTime.ofInstant(Instant.EPOCH, ZoneId.of(ZoneOffset.UTC.id))
    }
}

interface BaseEntity {
    val id: Long
    val metaData: EntityMetaData

    fun copyWithMetaData(metaData: EntityMetaData): BaseEntity
}
