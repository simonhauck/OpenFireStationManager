package io.github.simonhauck.openfirestationmanager.legal.impressum

import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

data class ImpressumDto(
    val name: String,
    val address: String,
    val contactEmail: String,
    val phone: String?,
)

data class ImpressumExists(val exists: Boolean)

@Table("impressum")
data class Impressum(
    val name: String,
    val address: String,
    val contactEmail: String,
    val phone: String?,
    @Id override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity<Impressum> {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity<Impressum> =
        copy(metaData = metaData)

    fun toDto(): ImpressumDto =
        ImpressumDto(
            name = name,
            address = address,
            contactEmail = contactEmail,
            phone = phone,
        )
}
