package io.github.simonhauck.openfirestationmanager.privacypolicy

import java.time.OffsetDateTime
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository

/**
 * Explicit JDBC repository for the single active privacy policy document. The `privacy_policy`
 * table holds at most one row at all times.
 */
@Repository
class PrivacyPolicyRepository(private val jdbcTemplate: NamedParameterJdbcTemplate) {

    fun find(): PrivacyPolicyDocument? {
        return jdbcTemplate
            .query(
                "SELECT file_name, content_type, file_size, uploaded_at, content FROM privacy_policy ORDER BY id LIMIT 1"
            ) { rs, _ ->
                PrivacyPolicyDocument(
                    fileName = rs.getString("file_name"),
                    contentType = rs.getString("content_type"),
                    fileSize = rs.getLong("file_size"),
                    uploadedAt =
                        rs.getObject("uploaded_at", OffsetDateTime::class.java).toZonedDateTime(),
                    content = rs.getBytes("content"),
                )
            }
            .firstOrNull()
    }

    fun save(document: PrivacyPolicyDocument) {
        delete()
        val parameters =
            MapSqlParameterSource()
                .addValue("fileName", document.fileName)
                .addValue("contentType", document.contentType)
                .addValue("fileSize", document.fileSize)
                .addValue("uploadedAt", OffsetDateTime.from(document.uploadedAt))
                .addValue("content", document.content)
        jdbcTemplate.update(
            """
            INSERT INTO privacy_policy (file_name, content_type, file_size, uploaded_at, content)
            VALUES (:fileName, :contentType, :fileSize, :uploadedAt, :content)
            """
                .trimIndent(),
            parameters,
        )
    }

    fun delete() {
        jdbcTemplate.update("DELETE FROM privacy_policy", MapSqlParameterSource())
    }
}
