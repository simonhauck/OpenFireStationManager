package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V017CreateResolvedClothingItemView : DatabaseMigration {
    override val id = "V017__create_resolved_clothing_item_view"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            CREATE VIEW resolved_clothing_item_view AS
            SELECT
                c_i.id                       AS item_id,
                c_i.type_id                  AS item_type_id,
                c_i.size                     AS item_size,
                c_i.barcode                  AS item_barcode,
                c_i.location_id              AS item_location_id,
                c_i.created_at               AS item_created_at,
                c_i.created_by               AS item_created_by,
                c_i.last_modified_at         AS item_last_modified_at,
                c_i.last_modified_by         AS item_last_modified_by,

                c_l.id                       AS location_id,
                c_l.name                     AS location_name,
                c_l.comment                  AS location_comment,
                c_l.only_visible_for_kleiderwart AS location_only_visible_for_kleiderwart,
                c_l.type                     AS location_type,
                c_l.created_at               AS location_created_at,
                c_l.created_by               AS location_created_by,
                c_l.last_modified_at         AS location_last_modified_at,
                c_l.last_modified_by         AS location_last_modified_by,

                c_t.id                       AS type_id,
                c_t.name                     AS type_name,
                c_t.created_at               AS type_created_at,
                c_t.created_by               AS type_created_by,
                c_t.last_modified_at         AS type_last_modified_at,
                c_t.last_modified_by         AS type_last_modified_by
            FROM clothing_items c_i
            LEFT JOIN clothing_locations c_l ON c_l.id = c_i.location_id
            JOIN clothing_types c_t ON c_t.id = c_i.type_id
            """
                .trimIndent()
        )
    }
}
