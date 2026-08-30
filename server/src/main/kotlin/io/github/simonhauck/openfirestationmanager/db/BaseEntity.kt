package io.github.simonhauck.openfirestationmanager.db

import com.fasterxml.jackson.annotation.JsonIgnore
import io.swagger.v3.oas.annotations.media.Schema
import java.time.Instant
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.ZonedDateTime
import org.springframework.data.jdbc.core.mapping.AggregateReference

@Schema(
    description =
        "Audit trail attached to every stored record. Maintained by the server on save — these " +
            "fields are ignored if supplied in a request. `System` appears as the actor for " +
            "changes made outside a user session, such as database migrations."
)
data class EntityMetaData(
    @field:Schema(description = "When the record was first stored.")
    val createdAt: ZonedDateTime = EPOCH_UTC,
    @field:Schema(
        description = "Username of whoever created the record, or `System`.",
        example = "m.mustermann",
    )
    val createdBy: String = "System",
    @field:Schema(description = "When the record was last changed.")
    val lastModifiedAt: ZonedDateTime = EPOCH_UTC,
    @field:Schema(
        description = "Username of whoever last changed the record, or `System`.",
        example = "m.mustermann",
    )
    val lastModifiedBy: String = "System",
) {

    companion object {
        private val EPOCH_UTC: ZonedDateTime =
            ZonedDateTime.ofInstant(Instant.EPOCH, ZoneId.of(ZoneOffset.UTC.id))
    }
}

interface BaseEntity<T : Any> {
    val id: Long
    val metaData: EntityMetaData

    fun copyWithMetaData(metaData: EntityMetaData): BaseEntity<T>

    @JsonIgnore
    fun getIdAsReference(): AggregateReference<T, Long> {
        return AggregateReference.to(id)
    }
}
