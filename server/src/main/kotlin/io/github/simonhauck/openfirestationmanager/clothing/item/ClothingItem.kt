package io.github.simonhauck.openfirestationmanager.clothing.item

import io.github.simonhauck.openfirestationmanager.clothing.location.ClothingLocation
import io.github.simonhauck.openfirestationmanager.clothing.type.ClothingType
import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size
import org.springframework.data.annotation.Id
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

@Schema(
    description =
        "Full set of properties for a clothing item. Used for both creation and replacement; " +
            "on update every field is applied, so omitted optional fields are cleared."
)
data class CreateOrUpdateClothingItemRequest(
    // TODO 19.04.26 - Simon.Hauck Conver the typeId also to an aggregate reference type
    @field:Schema(
        description =
            "Id of an existing clothing type (`Kleidungsart`) this garment belongs to. Must " +
                "reference a type that already exists.",
        example = "3",
    )
    @Positive
    val typeId: Long,
    @field:Schema(
        description =
            "Size label exactly as printed on the garment. Free text rather than an enum, " +
                "because sizing schemes differ per type — may be `52`, `XL`, or `Gr. 3`.",
        example = "52",
    )
    @NotBlank
    @Size(max = 255)
    val size: String,
    @field:Schema(
        description =
            "Station-assigned barcode printed on our label. Must be unique across all items. " +
                "Optional — a blank value is stored as null rather than an empty string.",
        example = "1234567890128",
    )
    @Size(max = 255)
    val barcode: String? = null,
    @field:Schema(
        description =
            "Manufacturer- or supplier-printed barcode (`Hersteller-Barcode`) on the garment " +
                "itself. Shares one value space with `barcode`: it must be unique across all " +
                "items. Optional — a blank value is stored as null rather than an empty string.",
        example = "4006381333931",
    )
    @Size(max = 255)
    val manufacturerBarcode: String? = null,
    @field:Schema(
        implementation = Long::class,
        description =
            "Id of the location where this garment currently is. Null means the item is not " +
                "assigned anywhere and will not show up in any location's stock.",
        example = "7",
    )
    val locationId: AggregateReference<ClothingLocation, Long>? = null,
) {
    fun barcodeSanitized(): String? {
        if (barcode?.isBlank() == true) return null
        return barcode
    }

    fun manufacturerBarcodeSanitized(): String? {
        if (manufacturerBarcode?.isBlank() == true) return null
        return manufacturerBarcode
    }
}

@Schema(description = "A set of clothing items to create together in a single transaction.")
data class BatchCreateClothingItemsRequest(
    @field:Schema(
        description =
            "Items to create. Must contain at least one entry. If any entry is invalid, or any " +
                "barcode value collides with an existing item, another entry in this list, or " +
                "the other barcode of its own item, the whole batch is rejected and nothing is " +
                "created."
    )
    @field:Valid
    @field:NotEmpty
    val items: List<CreateOrUpdateClothingItemRequest>
)

@Schema(
    description =
        "One physical garment. `typeId` and `locationId` are numeric references, not embedded " +
            "objects; see `ResolvedClothingItem` for the form that includes them in full."
)
@Table("clothing_items")
data class ClothingItem(
    @field:Schema(
        implementation = Long::class,
        description = "Id of the clothing type this garment belongs to.",
        example = "3",
    )
    val typeId: AggregateReference<ClothingType, Long>,
    @field:Schema(description = "Size label as printed on the garment.", example = "52")
    val size: String,
    @field:Schema(
        description = "Station-assigned barcode, unique across all items. Null if untagged.",
        example = "1234567890128",
    )
    val barcode: String? = null,
    @field:Schema(
        description =
            "Manufacturer- or supplier-printed barcode (`Hersteller-Barcode`), sharing the same " +
                "value space as `barcode` and therefore also unique across all items. Null if absent.",
        example = "4006381333931",
    )
    val manufacturerBarcode: String? = null,
    @field:Schema(
        implementation = Long::class,
        description = "Id of the location holding this garment. Null when unassigned.",
        example = "7",
    )
    val locationId: AggregateReference<ClothingLocation, Long>? = null,
    @field:Schema(description = "Server-assigned identifier.", example = "42")
    @Id
    override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity<ClothingItem> {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity<ClothingItem> {
        return copy(metaData = metaData)
    }
}
