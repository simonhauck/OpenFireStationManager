package io.github.simonhauck.openfirestationmanager.legal.impressum

import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

@Schema(
    description =
        "The legally required site notice (`Impressum`). At most one exists at a time — writing " +
            "replaces the previous one rather than adding to it."
)
data class ImpressumDto(
    @field:Schema(
        description = "Name of the responsible organisation or person.",
        example = "Freiwillige Feuerwehr Musterstadt",
    )
    @field:NotBlank
    @field:Size(max = 255)
    val name: String,
    @field:Schema(
        description = "Postal address, as a single free-text block.",
        example = "Hauptstraße 1, 12345 Musterstadt",
    )
    @field:NotBlank
    @field:Size(max = 1000)
    val address: String,
    @field:Schema(
        description = "Public contact email address.",
        example = "kontakt@feuerwehr-musterstadt.de",
    )
    @field:NotBlank
    @field:Email
    @field:Size(max = 255)
    val contactEmail: String,
    @field:Schema(
        description = "Public contact phone number. Optional.",
        example = "+49 1234 567890",
    )
    @field:Size(max = 255)
    val phone: String?,
)

@Schema(
    description =
        "Whether a site notice has been configured. Lets a caller check without needing " +
            "permission to read the notice itself."
)
data class ImpressumExists(
    @field:Schema(description = "True when a site notice exists.", example = "true")
    val exists: Boolean
)

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
        ImpressumDto(name = name, address = address, contactEmail = contactEmail, phone = phone)
}
