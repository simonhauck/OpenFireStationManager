package io.github.simonhauck.openfirestationmanager.migration

import io.github.simonhauck.openfirestationmanager.IntegrationTest
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.queryForList
import org.springframework.jdbc.core.queryForObject

class V022MigrateClothingLocationCommentsToMembersIT : IntegrationTest() {

    @Autowired private lateinit var jdbcTemplate: JdbcTemplate

    private val migration = V022MigrateClothingLocationCommentsToMembers()

    @Test
    fun `should create a member with the comment verbatim and clear the comment`() {
        val suffix = System.nanoTime()
        val ownerName = "  Hans  Mueller $suffix "
        val locationName = "Legacy Locker $suffix"

        try {
            val locationId = insertLocation(locationName, ownerName)

            migration.execute(jdbcTemplate)

            val memberId = memberIdByName(ownerName) ?: error("Expected a member for '$ownerName'")
            assertMigratedTo(listOf(locationId), memberId)
        } finally {
            cleanUp(listOf(locationName), listOf(ownerName))
        }
    }

    @Test
    fun `should collapse locations sharing a comment into one member owning both`() {
        val suffix = System.nanoTime()
        val ownerName = "Hans Mueller $suffix"
        val firstLocation = "Legacy Locker A $suffix"
        val secondLocation = "Legacy Locker B $suffix"

        try {
            val firstId = insertLocation(firstLocation, ownerName)
            val secondId = insertLocation(secondLocation, ownerName)

            migration.execute(jdbcTemplate)

            val memberId = memberIdByName(ownerName) ?: error("Expected a member for '$ownerName'")
            assertMigratedTo(listOf(firstId, secondId), memberId)
        } finally {
            cleanUp(listOf(firstLocation, secondLocation), listOf(ownerName))
        }
    }

    @Test
    fun `should collapse comments that differ only by case and surrounding whitespace`() {
        val suffix = System.nanoTime()
        val firstComment = "Hans Mueller $suffix"
        val secondComment = "  hans MUELLER $suffix  "
        val firstLocation = "Legacy Locker C $suffix"
        val secondLocation = "Legacy Locker D $suffix"

        try {
            val firstId = insertLocation(firstLocation, firstComment)
            val secondId = insertLocation(secondLocation, secondComment)

            migration.execute(jdbcTemplate)

            val memberNames =
                jdbcTemplate
                    .queryForList<String>(
                        "SELECT name FROM members WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))",
                        firstComment,
                    )
                    .filterNotNull()
            assertThat(memberNames).hasSize(1)
            val memberName = memberNames.first()
            assertThat(memberName).isIn(firstComment, secondComment)

            val memberId = memberIdByName(memberName) ?: error("Expected a member")
            assertMigratedTo(listOf(firstId, secondId), memberId)
        } finally {
            cleanUp(listOf(firstLocation, secondLocation), listOf(firstComment, secondComment))
        }
    }

    @Test
    fun `should skip locations with pool in the comment or name and keep their comments`() {
        val suffix = System.nanoTime()
        val poolComment = "Poolraum $suffix"
        val skippedComment = "Hans Mueller $suffix"
        val poolCommentLocation = "Legacy Locker E $suffix"
        val poolNameLocation = "Ersatzpool $suffix"

        try {
            val poolCommentId = insertLocation(poolCommentLocation, poolComment)
            val poolNameId = insertLocation(poolNameLocation, skippedComment)

            migration.execute(jdbcTemplate)

            assertThat(memberIdByName(poolComment)).isNull()
            assertThat(memberIdByName(skippedComment)).isNull()
            assertThat(locationMemberId(poolCommentId)).isNull()
            assertThat(locationComment(poolCommentId)).isEqualTo(poolComment)
            assertThat(locationMemberId(poolNameId)).isNull()
            assertThat(locationComment(poolNameId)).isEqualTo(skippedComment)
        } finally {
            cleanUp(
                listOf(poolCommentLocation, poolNameLocation),
                listOf(poolComment, skippedComment),
            )
        }
    }

    @Test
    fun `should skip non-personal and blank-comment locations and keep their comments`() {
        val suffix = System.nanoTime()
        val otherComment = "Nicht personal $suffix"
        val otherLocation = "Legacy Other $suffix"
        val blankLocation = "Legacy Blank $suffix"
        val blankComment = "   "

        try {
            val otherId = insertLocation(otherLocation, otherComment, type = "OTHER")
            val blankId = insertLocation(blankLocation, blankComment)

            migration.execute(jdbcTemplate)

            assertThat(memberIdByName(otherComment)).isNull()
            assertThat(locationMemberId(otherId)).isNull()
            assertThat(locationComment(otherId)).isEqualTo(otherComment)
            assertThat(locationMemberId(blankId)).isNull()
            assertThat(locationComment(blankId)).isEqualTo(blankComment)
        } finally {
            cleanUp(listOf(otherLocation, blankLocation), listOf(otherComment))
        }
    }

    @Test
    fun `should not change anything when executed a second time`() {
        val suffix = System.nanoTime()
        val ownerName = "Hans Mueller $suffix"
        val migratedLocation = "Legacy Locker F $suffix"
        val skippedLocation = "Legacy Pool Locker $suffix"
        val skippedComment = "Pool $suffix"

        try {
            val migratedId = insertLocation(migratedLocation, ownerName)
            val skippedId = insertLocation(skippedLocation, skippedComment)

            migration.execute(jdbcTemplate)
            val memberId = memberIdByName(ownerName) ?: error("Expected a member for '$ownerName'")
            val memberCountBeforeSecondRun = memberCount()
            val ownedLocationCountBeforeSecondRun = ownedLocationCount()

            migration.execute(jdbcTemplate)

            assertThat(memberCount()).isEqualTo(memberCountBeforeSecondRun)
            assertThat(ownedLocationCount()).isEqualTo(ownedLocationCountBeforeSecondRun)
            assertThat(
                    jdbcTemplate.queryForList<Long>(
                        "SELECT id FROM members WHERE name = ?",
                        ownerName,
                    )
                )
                .containsExactly(memberId)
            assertMigratedTo(listOf(migratedId), memberId)
            assertThat(locationMemberId(skippedId)).isNull()
            assertThat(locationComment(skippedId)).isEqualTo(skippedComment)
        } finally {
            cleanUp(listOf(migratedLocation, skippedLocation), listOf(ownerName, skippedComment))
        }
    }

    private fun insertLocation(name: String, comment: String, type: String = "PERSONAL"): Long =
        jdbcTemplate.queryForObject<Long>(
            "INSERT INTO clothing_locations (name, comment, type) VALUES (?, ?, ?) RETURNING id",
            name,
            comment,
            type,
        ) ?: error("Insert did not return an id for location '$name'")

    private fun memberIdByName(name: String): Long? =
        jdbcTemplate.queryForList<Long>("SELECT id FROM members WHERE name = ?", name).firstOrNull()

    private fun assertMigratedTo(locationIds: List<Long>, memberId: Long) {
        locationIds.forEach { locationId ->
            assertThat(locationMemberId(locationId)).isEqualTo(memberId)
            assertThat(locationComment(locationId)).isEmpty()
        }
    }

    private fun memberCount(): Long? =
        jdbcTemplate.queryForObject<Long>("SELECT COUNT(*) FROM members")

    private fun ownedLocationCount(): Long? =
        jdbcTemplate.queryForObject<Long>(
            "SELECT COUNT(*) FROM clothing_locations WHERE member_id IS NOT NULL"
        )

    private fun locationMemberId(locationId: Long): Long? =
        jdbcTemplate.queryForObject<Long>(
            "SELECT member_id FROM clothing_locations WHERE id = ?",
            locationId,
        )

    private fun locationComment(locationId: Long): String? =
        jdbcTemplate.queryForObject<String>(
            "SELECT comment FROM clothing_locations WHERE id = ?",
            locationId,
        )

    private fun cleanUp(locationNames: List<String>, memberNames: List<String>) {
        locationNames.forEach {
            jdbcTemplate.update("DELETE FROM clothing_locations WHERE name = ?", it)
        }
        memberNames.forEach { jdbcTemplate.update("DELETE FROM members WHERE name = ?", it) }
    }
}
