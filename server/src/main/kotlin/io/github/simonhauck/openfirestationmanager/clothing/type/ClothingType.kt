package io.github.simonhauck.openfirestationmanager.clothing.type

import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

@Schema(description = "The name of a clothing type. Used for both creation and update.")
data class CreateOrUpdateClothingTypeRequest(
    @field:Schema(
        description =
            "Display name of the category, e.g. `Einsatzjacke` or `Helm`. Names are not " +
                "required to be unique, but duplicates make the overview reports ambiguous.",
        example = "Einsatzjacke",
    )
    @NotBlank
    @Size(max = 255)
    val name: String
)

@Schema(
    description =
        "A category of garment (`Kleidungsart`), such as `Einsatzjacke` or `Helm`. Types carry " +
            "no size or quantity of their own — those live on the individual clothing items."
)
@Table("clothing_types")
data class ClothingType(
    @field:Schema(description = "Display name of the category.", example = "Einsatzjacke")
    val name: String,
    @field:Schema(description = "Server-assigned identifier.", example = "3")
    @Id
    override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity<ClothingType> {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity<ClothingType> {
        return copy(metaData = metaData)
    }
}
