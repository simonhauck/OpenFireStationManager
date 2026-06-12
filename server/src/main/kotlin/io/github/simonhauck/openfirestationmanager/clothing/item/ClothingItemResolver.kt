package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.location.LocationType
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.github.simonhauck.openfirestationmanager.common.PublicApiException
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import java.sql.ResultSet
import java.sql.Timestamp
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.ZonedDateTime
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.http.HttpStatus
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.RowMapper
import org.springframework.stereotype.Service

@Service
class ClothingItemResolver(private val jdbcTemplate: JdbcTemplate) {

    fun resolveOne(itemId: Long): ResolvedClothingItem {
        val results =
            jdbcTemplate.query(
                "SELECT * FROM resolved_clothing_item_view WHERE item_id = ?",
                rowMapper,
                itemId,
            )
        if (results.isEmpty()) {
            throw PublicApiException(HttpStatus.NOT_FOUND, "Item with id $itemId not found")
        }
        return results.first()
    }

    fun resolveAll(): List<ResolvedClothingItem> {
        return jdbcTemplate.query("SELECT * FROM resolved_clothing_item_view", rowMapper)
    }

    fun resolveByBarcode(barcode: String): ResolvedClothingItem? {
        val results =
            jdbcTemplate.query(
                "SELECT * FROM resolved_clothing_item_view WHERE item_barcode = ?",
                rowMapper,
                barcode,
            )
        return results.firstOrNull()
    }

    private val rowMapper = RowMapper { rs, _ ->
        val item = buildClothingItem(rs)
        val location = buildClothingLocation(rs)
        val type = buildClothingType(rs)
        ResolvedClothingItem(clothingItem = item, location = location, clothingType = type)
    }

    private fun buildClothingItem(rs: ResultSet): ClothingItem {
        val locationId: AggregateReference<ClothingLocation, Long>? =
            rs.getNullableLong("item_location_id")?.let { AggregateReference.to(it) }

        return ClothingItem(
            id = rs.getLong("item_id"),
            typeId = AggregateReference.to(rs.getLong("item_type_id")),
            size = rs.getString("item_size"),
            barcode = rs.getString("item_barcode"),
            locationId = locationId,
            metaData = buildMetaData(rs, "item"),
        )
    }

    private fun buildClothingLocation(rs: ResultSet): ClothingLocation? {
        val locationId = rs.getNullableLong("location_id") ?: return null
        return ClothingLocation(
            id = locationId,
            name = rs.getString("location_name"),
            comment = rs.getString("location_comment"),
            onlyVisibleForKleiderwart = rs.getBoolean("location_only_visible_for_kleiderwart"),
            type = LocationType.valueOf(rs.getString("location_type")),
            metaData = buildMetaData(rs, "location"),
        )
    }

    private fun buildClothingType(rs: ResultSet): ClothingType {
        return ClothingType(
            id = rs.getLong("type_id"),
            name = rs.getString("type_name"),
            metaData = buildMetaData(rs, "type"),
        )
    }

    private fun buildMetaData(rs: ResultSet, prefix: String): EntityMetaData {
        return EntityMetaData(
            createdAt = rs.getZonedDateTime("${prefix}_created_at"),
            createdBy = rs.getString("${prefix}_created_by"),
            lastModifiedAt = rs.getZonedDateTime("${prefix}_last_modified_at"),
            lastModifiedBy = rs.getString("${prefix}_last_modified_by"),
        )
    }

    private fun ResultSet.getNullableLong(column: String): Long? {
        val value = getLong(column)
        return if (wasNull()) null else value
    }

    private fun ResultSet.getZonedDateTime(column: String): ZonedDateTime {
        val timestamp: Timestamp? = getTimestamp(column)
        return timestamp?.toInstant()?.atZone(ZoneId.of(ZoneOffset.UTC.id))
            ?: ZonedDateTime.ofInstant(java.time.Instant.EPOCH, ZoneId.of(ZoneOffset.UTC.id))
    }
}
