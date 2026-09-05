package io.github.simonhauck.openfirestationmanager.clothing.location

import io.github.simonhauck.openfirestationmanager.db.BaseEntity
import io.github.simonhauck.openfirestationmanager.db.EntityMetaData
import io.github.simonhauck.openfirestationmanager.member.Member
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Size
import org.springframework.data.annotation.Id
import org.springframework.data.jdbc.core.mapping.AggregateReference
import org.springframework.data.relational.core.mapping.Embedded
import org.springframework.data.relational.core.mapping.Table

@Schema(
    description =
        """
        What kind of place a location is. This drives behaviour, not just labelling:

        - `POOL` — shared stock anyone may take from. The default source for a checkout.
        - `WAESCHE` — at the laundry. Garments here are in circulation but unavailable.
        - `PERSONAL` — assigned to one member, e.g. a named locker or peg.
        - `OTHER` — anything that fits none of the above.
        """
)
enum class LocationType {
    POOL,
    WAESCHE,
    PERSONAL,
    OTHER,
}

@Schema(
    description =
        "Full set of properties for a clothing location. Used for both creation and update; " +
            "on update every field is applied, so this is a full replacement."
)
data class CreateClothingLocationRequest(
    @field:Schema(
        description = "Display name of the place, e.g. `Spind 12` or `Lager Regal B`.",
        example = "Spind 12",
    )
    @NotBlank
    @Size(max = 255)
    val name: String,
    @field:Schema(
        description =
            "Free-text note about this location. Required, but may be an empty string — it is " +
                "not nullable.",
        example = "Zweite Reihe, links",
    )
    @Size(max = 255)
    val comment: String,
    @field:Schema(
        description =
            "When true, this location and every garment in it are hidden from users who do not " +
                "hold the `KLEIDERWART` role. Such items read as not found in barcode lookup " +
                "and never appear in search results.",
        example = "false",
    )
    val onlyVisibleForKleiderwart: Boolean,
    @field:Schema(description = "What kind of place this is.") val type: LocationType,
    @field:Schema(
        implementation = Long::class,
        types = ["integer", "null"],
        description =
            "Id of the member who owns this location. Only `PERSONAL` locations may have an owner.",
        example = "5",
    )
    val memberId: AggregateReference<Member, Long>? = null,
)

@Schema(description = "A set of clothing locations to create together in a single request.")
data class BatchCreateClothingLocationsRequest(
    @field:Schema(
        description =
            "Locations to create. Must contain at least one entry, and every entry is validated " +
                "individually."
    )
    @field:Valid
    @field:NotEmpty
    val items: List<CreateClothingLocationRequest>
)

@Schema(
    description =
        "A place where garments are kept (`Standort`) — the shared pool, the laundry, a " +
            "member's personal locker, or anywhere else."
)
@Table("clothing_locations")
data class ClothingLocation(
    @field:Schema(description = "Display name of the place.", example = "Spind 12")
    val name: String,
    @field:Schema(description = "Free-text note. May be empty, never null.") val comment: String,
    @field:Schema(
        description = "When true, only `KLEIDERWART` users may see this location and its contents.",
        example = "false",
    )
    val onlyVisibleForKleiderwart: Boolean,
    @field:Schema(description = "What kind of place this is.") val type: LocationType,
    @field:Schema(
        implementation = Long::class,
        types = ["integer", "null"],
        description =
            "Id of the member who owns this location. Only `PERSONAL` locations may have an owner.",
        example = "5",
    )
    val memberId: AggregateReference<Member, Long>? = null,
    @field:Schema(description = "Server-assigned identifier.", example = "7")
    @Id
    override val id: Long = 0,
    @Embedded.Nullable override val metaData: EntityMetaData = EntityMetaData(),
) : BaseEntity<ClothingLocation> {
    override fun copyWithMetaData(metaData: EntityMetaData): BaseEntity<ClothingLocation> {
        return copy(metaData = metaData)
    }
}
