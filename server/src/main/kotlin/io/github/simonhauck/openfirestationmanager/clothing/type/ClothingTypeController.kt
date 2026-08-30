package io.github.simonhauck.openfirestationmanager.clothing.type

import io.github.simonhauck.openfirestationmanager.common.ApiTags
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.Positive
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/clothing/types")
@Validated
@Tag(name = ApiTags.CLOTHING_TYPES)
class ClothingTypeController(private val service: ClothingTypeService) {

    @GetMapping
    @Operation(
        operationId = "listClothingTypes",
        summary = "List every clothing type",
        description =
            "Returns all garment categories (`Kleidungsart`) known to the station, such as " +
                "`Einsatzjacke` or `Helm`. Types are the vocabulary the rest of the clothing API " +
                "is built on: start here to discover the valid `typeId` values before creating " +
                "or searching for items.\n\n" +
                "The list is small and is returned unpaginated.",
    )
    fun getAllTypes(): List<ClothingType> = service.getAllTypes()

    @GetMapping("/{id}")
    @Operation(
        operationId = "getClothingType",
        summary = "Get one clothing type by its numeric id",
        description = "Looks up a single garment category by its database id.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The clothing type."),
        ApiResponse(
            responseCode = "404",
            description = "No clothing type exists with this id.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    fun getTypeById(
        @Parameter(description = "Numeric id of the clothing type.", example = "3")
        @PathVariable
        @Positive
        id: Long
    ): ClothingType = service.getTypeById(id)

    @PostMapping
    @Operation(
        operationId = "createClothingType",
        summary = "Create a new clothing type",
        description =
            "Registers a new garment category. Do this before creating items of a kind the " +
                "station has never held before.\n\n" +
                "Names are not enforced to be unique, so check the existing list first to avoid " +
                "creating a near-duplicate that will split the overview reports in two.",
    )
    @ApiResponses(ApiResponse(responseCode = "200", description = "The newly created type."))
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun createType(@Valid @RequestBody request: CreateOrUpdateClothingTypeRequest): ClothingType =
        service.createType(request)

    @PatchMapping("/{id}")
    @Operation(
        operationId = "updateClothingType",
        summary = "Rename a clothing type",
        description =
            "Changes the display name of a category. Items already assigned to this type keep " +
                "their assignment and immediately report the new name.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "The updated type."),
        ApiResponse(
            responseCode = "404",
            description = "No clothing type exists with this id.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun updateType(
        @Parameter(description = "Numeric id of the clothing type to rename.", example = "3")
        @PathVariable
        @Positive
        id: Long,
        @Valid @RequestBody request: CreateOrUpdateClothingTypeRequest,
    ): ClothingType = service.updateType(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
        operationId = "deleteClothingType",
        summary = "Delete a clothing type",
        description =
            "Removes a garment category. This is only possible once no clothing item references " +
                "the type any more — the request is refused with `409 Conflict` otherwise, rather " +
                "than cascading. Delete or re-type the remaining items first.",
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "The type was deleted."),
        ApiResponse(
            responseCode = "404",
            description = "No clothing type exists with this id.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
        ApiResponse(
            responseCode = "409",
            description =
                "Clothing items still reference this type. Nothing was deleted; the message " +
                    "states how many items remain.",
            content =
                [
                    Content(
                        mediaType = "application/problem+json",
                        schema = Schema(implementation = ProblemDetail::class),
                    )
                ],
        ),
    )
    @PreAuthorize("hasRole('ROLE_KLEIDERWART')")
    fun deleteType(
        @Parameter(description = "Numeric id of the clothing type to delete.", example = "3")
        @PathVariable
        @Positive
        id: Long
    ) {
        service.deleteType(id)
    }
}
