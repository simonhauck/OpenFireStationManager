package io.github.simonhauck.openfirestationmanager.migration

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

@Component
class V022MigrateClothingLocationCommentsToMembers : DatabaseMigration {
    override val id = "V022__migrate_clothing_location_comments_to_members"

    override fun execute(jdbcTemplate: JdbcTemplate) {
        jdbcTemplate.execute(
            """
            WITH candidates AS (
                SELECT id, comment, LOWER(TRIM(comment)) AS normalized_comment
                FROM clothing_locations
                WHERE member_id IS NULL
                  AND type = 'PERSONAL'
                  AND TRIM(comment) <> ''
                  AND comment NOT ILIKE '%pool%'
                  AND name NOT ILIKE '%pool%'
            ),
            new_members AS (
                INSERT INTO members (name)
                SELECT MIN(comment)
                FROM candidates
                GROUP BY normalized_comment
                RETURNING id, name
            )
            UPDATE clothing_locations AS location
            SET member_id = new_member.id,
                comment = ''
            FROM candidates
            JOIN new_members AS new_member
                ON LOWER(TRIM(new_member.name)) = candidates.normalized_comment
            WHERE location.id = candidates.id
            """
                .trimIndent()
        )
    }
}
